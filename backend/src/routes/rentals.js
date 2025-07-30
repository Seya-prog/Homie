const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, requireKYC } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/rentals
// @desc    Create a new rental agreement
// @access  Private (Landlord only)
router.post('/', [auth, requireKYC], [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('tenantId').notEmpty().withMessage('Tenant ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent amount must be positive'),
  body('deposit').isFloat({ min: 0 }).withMessage('Deposit must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { propertyId, tenantId, startDate, endDate, rentAmount, deposit } = req.body;

    // Verify property ownership
    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to create rental for this property' });
    }

    // Verify tenant exists and is verified
    const tenant = await prisma.user.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    if (!tenant.faydaVerified) {
      return res.status(400).json({ message: 'Tenant must be verified via Fayda before creating rental' });
    }

    // Create rental
    const rental = await prisma.rental.create({
      data: {
        propertyId,
        tenantId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentAmount: parseFloat(rentAmount),
        deposit: parseFloat(deposit)
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true
          }
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    // Update property status
    await prisma.property.update({
      where: { id: propertyId },
      data: { status: 'RENTED', available: false }
    });

    res.status(201).json({
      message: 'Rental agreement created successfully',
      rental
    });
  } catch (error) {
    console.error('Create rental error:', error);
    res.status(500).json({ message: 'Server error while creating rental' });
  }
});

// @route   GET /api/rentals/my-rentals
// @desc    Get current user's rentals
// @access  Private
router.get('/my-rentals', [auth], async (req, res) => {
  try {
    const { status } = req.query;

    const where = { tenantId: req.user.id };
    if (status) where.status = status;

    const rentals = await prisma.rental.findMany({
      where,
      include: {
        property: {
          include: {
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true
              }
            }
          }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            paymentType: true,
            dueDate: true,
            paidAt: true
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ rentals });
  } catch (error) {
    console.error('Get my rentals error:', error);
    res.status(500).json({ message: 'Server error while fetching rentals' });
  }
});

module.exports = router;