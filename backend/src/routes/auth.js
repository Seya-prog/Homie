const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const faydaService = require('../services/faydaService');
const auth = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '24h'
  });
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').isIn(['TENANT', 'LANDLORD']).withMessage('Invalid role')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, firstName, lastName, phone, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        role
      }
    });

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    res.json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   GET /api/auth/fayda/authorize
// @desc    Initiate Fayda OAuth flow
// @access  Private
router.get('/fayda/authorize', auth, async (req, res) => {
  try {
    const state = `${req.user.id}-${Date.now()}`;
    const nonce = require('crypto').randomBytes(32).toString('hex');
    
    // Store state and nonce in session or cache for validation
    // For now, we'll store in user record temporarily
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        kycData: {
          state,
          nonce,
          initiatedAt: new Date()
        }
      }
    });

    const authUrl = faydaService.generateAuthorizationUrl(state, nonce);
    
    res.json({
      message: 'Fayda authorization URL generated',
      authUrl,
      state,
      testCredentials: faydaService.generateTestCredentials()
    });
  } catch (error) {
    console.error('Fayda authorization error:', error);
    res.status(500).json({ message: 'Failed to initiate Fayda verification' });
  }
});

// @route   POST /api/auth/fayda/callback
// @desc    Handle Fayda OAuth callback
// @access  Public
router.post('/fayda/callback', [
  body('code').notEmpty().withMessage('Authorization code is required'),
  body('state').notEmpty().withMessage('State parameter is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { code, state } = req.body;

    // Extract user ID from state
    const [userId] = state.split('-');

    // Find user and validate state
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user || !user.kycData || user.kycData.state !== state) {
      return res.status(400).json({ message: 'Invalid state parameter' });
    }

    // Verify user identity with Fayda
    const verificationData = await faydaService.verifyUserIdentity(code);

    // Update user with Fayda verification data
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        faydaId: verificationData.faydaId,
        faydaVerified: true,
        kycStatus: 'VERIFIED',
        firstName: verificationData.personalInfo.firstName || user.firstName,
        lastName: verificationData.personalInfo.lastName || user.lastName,
        phone: verificationData.personalInfo.phone || user.phone,
        kycData: verificationData
      }
    });

    // Generate new token
    const token = generateToken(updatedUser.id);

    // Remove sensitive data from response
    const { password: _, kycData, ...userResponse } = updatedUser;

    res.json({
      message: 'Fayda verification completed successfully',
      user: userResponse,
      token,
      verified: true
    });
  } catch (error) {
    console.error('Fayda callback error:', error);
    res.status(500).json({ 
      message: 'Failed to complete Fayda verification',
      error: error.message 
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        faydaId: true,
        faydaVerified: true,
        kycStatus: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', auth, [
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const allowedUpdates = ['firstName', 'lastName', 'phone', 'avatar'];
    const updates = {};

    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: updates,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
        faydaVerified: true,
        kycStatus: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error during profile update' });
  }
});

// @route   POST /api/auth/change-password
// @desc    Change user password
// @access  Private
router.post('/change-password', auth, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error during password change' });
  }
});

// @route   GET /api/auth/kyc-status
// @desc    Get KYC verification status
// @access  Private
router.get('/kyc-status', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        faydaId: true,
        faydaVerified: true,
        kycStatus: true,
        kycData: true
      }
    });

    let kycDetails = null;
    if (user.faydaId) {
      kycDetails = await faydaService.checkKYCStatus(user.faydaId);
    }

    res.json({
      kycStatus: user.kycStatus,
      faydaVerified: user.faydaVerified,
      faydaId: user.faydaId,
      kycDetails
    });
  } catch (error) {
    console.error('KYC status error:', error);
    res.status(500).json({ message: 'Failed to get KYC status' });
  }
});

module.exports = router;