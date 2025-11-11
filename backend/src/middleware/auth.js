const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const auth = async (req, res, next) => {
  try {
    // Get token from header or cookie
    const authHeader = req.header('Authorization');
    let token = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token; // Get from HTTP-only cookie
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        faydaVerified: true,
        kycStatus: true
      }
    });

    if (!user) {
      return res.status(401).json({ message: 'Token is not valid' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token has expired' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    } else {
      console.error('Auth middleware error:', error);
      return res.status(500).json({ message: 'Server error in authentication' });
    }
  }
};

// Middleware to check if user is verified via Fayda
const requireKYC = (req, res, next) => {
  if (!req.user.faydaVerified || req.user.kycStatus !== 'VERIFIED') {
    return res.status(403).json({ 
      message: 'KYC verification required to access this resource',
      kycStatus: req.user.kycStatus,
      faydaVerified: req.user.faydaVerified
    });
  }
  next();
};

// Middleware to check user role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }
    next();
  };
};

// Middleware to check if user is landlord
const requireLandlord = requireRole(['LANDLORD', 'ADMIN']);

// Middleware to check if user is admin
const requireAdmin = requireRole(['ADMIN']);

module.exports = {
  auth,
  requireKYC,
  requireRole,
  requireLandlord,
  requireAdmin
};