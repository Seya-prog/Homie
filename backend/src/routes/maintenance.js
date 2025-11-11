const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, requireKYC } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// @route   POST /api/maintenance
// @desc    Create a maintenance request
// @access  Private
router.post('/', [auth, requireKYC], [
  body('propertyId').notEmpty().withMessage('Property ID is required'),
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).withMessage('Invalid priority')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { propertyId, title, description, priority = 'MEDIUM' } = req.body;

    // Verify user has access to property (tenant or owner)
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      include: {
        rentals: {
          where: { tenantId: req.user.id, status: 'ACTIVE' }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const isOwner = property.ownerId === req.user.id;
    const isTenant = property.rentals.length > 0;

    if (!isOwner && !isTenant && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to create maintenance request for this property' });
    }

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        propertyId,
        requesterId: req.user.id,
        title,
        description,
        priority
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            owner: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Maintenance request created successfully',
      maintenanceRequest
    });
  } catch (error) {
    console.error('Create maintenance request error:', error);
    res.status(500).json({ message: 'Server error while creating maintenance request' });
  }
});

// @route   GET /api/maintenance
// @desc    Get maintenance requests
// @access  Private
router.get('/', [auth], async (req, res) => {
  try {
    const { status, priority, propertyId } = req.query;

    let where = {};

    // Filter based on user role
    if (req.user.role === 'TENANT') {
      where.requesterId = req.user.id;
    } else if (req.user.role === 'LANDLORD') {
      const userProperties = await prisma.property.findMany({
        where: { ownerId: req.user.id },
        select: { id: true }
      });
      where.propertyId = { in: userProperties.map(p => p.id) };
    }
    // ADMIN can see all

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (propertyId) where.propertyId = propertyId;

    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true
          }
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ maintenanceRequests });
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({ message: 'Server error while fetching maintenance requests' });
  }
});

// @route   GET /api/maintenance/requests
// @desc    Get maintenance requests for landlord
// @access  Private (Landlord)
router.get('/requests', auth, async (req, res) => {
  try {
    let whereClause = {};
    
    if (req.user.role === 'LANDLORD') {
      // Landlords see requests for their properties
      whereClause = {
        property: {
          ownerId: req.user.id
        }
      };
    } else if (req.user.role === 'TENANT') {
      // Tenants see their own requests
      whereClause = {
        requesterId: req.user.id
      };
    } else if (req.user.role === 'ADMIN') {
      // Admins see all requests
      whereClause = {};
    } else {
      return res.status(403).json({ message: 'Not authorized to view maintenance requests' });
    }

    const maintenanceRequests = await prisma.maintenanceRequest.findMany({
      where: whereClause,
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
            city: true
          }
        },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: maintenanceRequests,
      total: maintenanceRequests.length
    });
  } catch (error) {
    console.error('Get maintenance requests error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch maintenance requests' 
    });
  }
});

module.exports = router;