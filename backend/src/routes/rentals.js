const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, requireKYC } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/rentals/apply
// @desc    Submit a rental application (Tenant)
// @access  Private (Tenant only)
router.post('/apply', [auth], [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Verify user is a tenant
    if (req.user.role !== 'TENANT') {
      return res.status(403).json({ message: 'Only tenants can submit rental applications' });
    }

    const { propertyId, startDate, endDate } = req.body;
    const tenantId = req.user.id;

    // Verify property exists and is available
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.status !== 'AVAILABLE') {
      return res.status(400).json({ message: 'Property is not available for rent' });
    }

    // Create rental application with PENDING status
    const rental = await prisma.rental.create({
      data: {
        propertyId,
        tenantId,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        rentAmount: property.rentAmount,
        deposit: property.deposit,
        status: 'PENDING'
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            rentAmount: true,
            deposit: true
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

    res.status(201).json({
      message: 'Rental application submitted successfully',
      rental
    });
  } catch (error) {
    console.error('Apply for rental error:', error);
    res.status(500).json({ message: 'Server error while submitting application' });
  }
});

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
// @desc    Get current user's rentals (tenant view)
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

// @route   GET /api/rentals/applications
// @desc    Get rental applications for landlord's properties
// @access  Private (Landlord only)
router.get('/applications', [auth], async (req, res) => {
  try {
    if (req.user.role !== 'LANDLORD' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Only landlords can view applications' });
    }

    const { status } = req.query;

    // Get all properties owned by the landlord
    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      select: { id: true }
    });

    const propertyIds = properties.map(p => p.id);

    // Get all rental applications for these properties
    const where = {
      propertyId: { in: propertyIds }
    };
    
    if (status) {
      where.status = status;
    }

    const applications = await prisma.rental.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            images: true,
            propertyType: true,
            bedrooms: true,
            bathrooms: true
          }
        },
        tenant: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            faydaVerified: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ applications });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ message: 'Server error while fetching applications' });
  }
});

// @route   PUT /api/rentals/:id/status
// @desc    Update rental application status (approve/reject)
// @access  Private (Landlord only)
router.put('/:id/status', [auth], [
  body('status').isIn(['ACTIVE', 'TERMINATED', 'PENDING']).withMessage('Invalid status')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Get the rental with property info
    const rental = await prisma.rental.findUnique({
      where: { id },
      include: {
        property: true
      }
    });

    if (!rental) {
      return res.status(404).json({ message: 'Rental application not found' });
    }

    // Verify ownership
    if (rental.property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Update rental status
    const updatedRental = await prisma.rental.update({
      where: { id },
      data: { status },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true
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

    // If approved (ACTIVE), update property status
    if (status === 'ACTIVE') {
      console.log(`✅ Approving application ${id}, updating property ${rental.propertyId} to RENTED`);
      
      const updatedProperty = await prisma.property.update({
        where: { id: rental.propertyId },
        data: { status: 'RENTED', available: false }
      });
      
      console.log(`✅ Property updated:`, {
        id: updatedProperty.id,
        title: updatedProperty.title,
        status: updatedProperty.status,
        available: updatedProperty.available
      });
    }

    res.json({
      message: 'Application status updated successfully',
      rental: updatedRental
    });
  } catch (error) {
    console.error('Update rental status error:', error);
    res.status(500).json({ message: 'Server error while updating status' });
  }
});

module.exports = router;