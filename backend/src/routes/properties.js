const express = require('express');
const { body, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, requireKYC, requireLandlord } = require('../middleware/auth');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

const router = express.Router();
const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/properties
// @desc    Get all properties with filters
// @access  Public
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('city').optional().isString(),
  query('propertyType').optional().isIn(['APARTMENT', 'HOUSE', 'CONDO', 'STUDIO', 'ROOM', 'VILLA', 'PENTHOUSE', 'TOWNHOUSE', 'COMMERCIAL', 'OFFICE', 'RETAIL', 'WAREHOUSE', 'LAND']),
  query('listingType').optional().isIn(['RENT', 'SALE', 'BOTH']),
  query('minPrice').optional().isFloat({ min: 0 }),
  query('maxPrice').optional().isFloat({ min: 0 }),
  query('bedrooms').optional().isInt({ min: 0 }),
  query('bathrooms').optional().isFloat({ min: 0 }),
  query('furnished').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      page = 1,
      limit = 10,
      city,
      propertyType,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      furnished
    } = req.query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      status: 'AVAILABLE',
      available: true
    };

    if (city) {
      where.city = { contains: city, mode: 'insensitive' };
    }

    if (propertyType) {
      where.propertyType = propertyType;
    }

    if (minPrice || maxPrice) {
      where.rentAmount = {};
      if (minPrice) where.rentAmount.gte = parseFloat(minPrice);
      if (maxPrice) where.rentAmount.lte = parseFloat(maxPrice);
    }

    if (bedrooms) {
      where.bedrooms = parseInt(bedrooms);
    }

    if (bathrooms) {
      where.bathrooms = parseFloat(bathrooms);
    }

    if (furnished !== undefined) {
      where.furnished = furnished === 'true';
    }

    const [properties, total] = await Promise.all([
      prisma.property.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          owner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              faydaVerified: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.property.count({ where })
    ]);

    // Calculate average rating for each property
    const propertiesWithRatings = properties.map(property => {
      const avgRating = property.reviews.length > 0
        ? property.reviews.reduce((sum, review) => sum + review.rating, 0) / property.reviews.length
        : 0;
      
      return {
        ...property,
        averageRating: avgRating,
        reviewCount: property.reviews.length,
        reviews: undefined // Remove reviews from response
      };
    });

    res.json({
      properties: propertiesWithRatings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get properties error:', error);
    res.status(500).json({ message: 'Server error while fetching properties' });
  }
});

// @route   GET /api/properties/:id
// @desc    Get single property by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            faydaVerified: true,
            kycStatus: true
          }
        },
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Calculate average rating
    const avgRating = property.reviews.length > 0
      ? property.reviews.reduce((sum, review) => sum + review.rating, 0) / property.reviews.length
      : 0;

    res.json({
      ...property,
      averageRating: avgRating,
      reviewCount: property.reviews.length
    });
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ message: 'Server error while fetching property' });
  }
});

// @route   POST /api/properties
// @desc    Create a new property
// @access  Private (Landlord only, KYC required)
router.post('/', [auth, requireKYC, requireLandlord], [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('address').notEmpty().withMessage('Address is required'),
  body('city').notEmpty().withMessage('City is required'),
  body('state').notEmpty().withMessage('State is required'),
  body('zipCode').notEmpty().withMessage('Zip code is required'),
  body('propertyType').isIn(['APARTMENT', 'HOUSE', 'CONDO', 'STUDIO', 'ROOM', 'COMMERCIAL']).withMessage('Invalid property type'),
  body('bedrooms').isInt({ min: 0 }).withMessage('Bedrooms must be a non-negative integer'),
  body('bathrooms').isFloat({ min: 0 }).withMessage('Bathrooms must be a non-negative number'),
  body('area').isFloat({ min: 0 }).withMessage('Area must be a positive number'),
  body('rentAmount').isFloat({ min: 0 }).withMessage('Rent amount must be a positive number'),
  body('deposit').isFloat({ min: 0 }).withMessage('Deposit must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const propertyData = {
      ...req.body,
      ownerId: req.user.id
    };

    const property = await prisma.property.create({
      data: propertyData,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            faydaVerified: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Property created successfully',
      property
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ message: 'Server error while creating property' });
  }
});

// @route   PUT /api/properties/:id
// @desc    Update property
// @access  Private (Owner only)
router.put('/:id', [auth, requireKYC], [
  body('title').optional().notEmpty().withMessage('Title cannot be empty'),
  body('description').optional().notEmpty().withMessage('Description cannot be empty'),
  body('rentAmount').optional().isFloat({ min: 0 }).withMessage('Rent amount must be positive'),
  body('deposit').optional().isFloat({ min: 0 }).withMessage('Deposit must be positive')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    // Check if property exists and user owns it
    const existingProperty = await prisma.property.findUnique({
      where: { id }
    });

    if (!existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (existingProperty.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to update this property' });
    }

    const updatedProperty = await prisma.property.update({
      where: { id },
      data: req.body,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            faydaVerified: true
          }
        }
      }
    });

    res.json({
      message: 'Property updated successfully',
      property: updatedProperty
    });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ message: 'Server error while updating property' });
  }
});

// @route   DELETE /api/properties/:id
// @desc    Delete property
// @access  Private (Owner only)
router.delete('/:id', [auth, requireKYC], async (req, res) => {
  try {
    const { id } = req.params;

    // Check if property exists and user owns it
    const existingProperty = await prisma.property.findUnique({
      where: { id }
    });

    if (!existingProperty) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (existingProperty.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to delete this property' });
    }

    await prisma.property.delete({
      where: { id }
    });

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ message: 'Server error while deleting property' });
  }
});

// @route   POST /api/properties/:id/images
// @desc    Upload property images
// @access  Private (Owner only)
router.post('/:id/images', [auth, requireKYC], upload.array('images', 10), async (req, res) => {
  try {
    const { id } = req.params;

    // Check if property exists and user owns it
    const property = await prisma.property.findUnique({
      where: { id }
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    if (property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to upload images for this property' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No images provided' });
    }

    // Upload images to Cloudinary
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: `homie/properties/${id}`,
            resource_type: 'image'
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result.secure_url);
          }
        ).end(file.buffer);
      });
    });

    const imageUrls = await Promise.all(uploadPromises);

    // Update property with new images
    const updatedProperty = await prisma.property.update({
      where: { id },
      data: {
        images: [...property.images, ...imageUrls]
      }
    });

    res.json({
      message: 'Images uploaded successfully',
      images: imageUrls
    });
  } catch (error) {
    console.error('Upload images error:', error);
    res.status(500).json({ message: 'Server error while uploading images' });
  }
});

// @route   GET /api/properties/search
// @desc    Advanced property search
// @access  Public
router.get('/search/advanced', [
  query('q').optional().isString(),
  query('location').optional().isString(),
  query('radius').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const { q, location, radius = 10 } = req.query;

    let where = {
      status: 'AVAILABLE',
      available: true
    };

    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { city: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } }
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            faydaVerified: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ properties });
  } catch (error) {
    console.error('Advanced search error:', error);
    res.status(500).json({ message: 'Server error during search' });
  }
});

// @route   GET /api/properties/my-properties
// @desc    Get current user's properties
// @access  Private (Landlord only)
router.get('/my/properties', [auth, requireLandlord], async (req, res) => {
  try {
    const properties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      include: {
        rentals: {
          include: {
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
        },
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate statistics
    const propertiesWithStats = properties.map(property => {
      const avgRating = property.reviews.length > 0
        ? property.reviews.reduce((sum, review) => sum + review.rating, 0) / property.reviews.length
        : 0;
      
      return {
        ...property,
        averageRating: avgRating,
        reviewCount: property.reviews.length,
        activeRentals: property.rentals.filter(r => r.status === 'ACTIVE').length
      };
    });

    res.json({ properties: propertiesWithStats });
  } catch (error) {
    console.error('Get my properties error:', error);
    res.status(500).json({ message: 'Server error while fetching properties' });
  }
});

module.exports = router;