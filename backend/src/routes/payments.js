const express = require('express');
const { body, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const { auth, requireKYC } = require('../middleware/auth');
const axios = require('axios');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

// Chapa API configuration
const CHAPA_URL = 'https://api.chapa.co/v1';
const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY;

// Helper function to generate payment reference
const generatePaymentReference = () => {
  return `HOMIE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

// @route   POST /api/payments/initialize
// @desc    Initialize payment with Chapa
// @access  Private
router.post('/initialize', [auth, requireKYC], [
  body('rentalId').notEmpty().withMessage('Rental ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentType').isIn(['RENT', 'DEPOSIT', 'MAINTENANCE', 'PENALTY']).withMessage('Invalid payment type')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rentalId, amount, paymentType, description } = req.body;

    // Verify rental exists and user has access
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        property: {
          include: {
            owner: true
          }
        },
        tenant: true
      }
    });

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    // Check if user is tenant of this rental
    if (rental.tenantId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to make payment for this rental' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Validate user data before sending to Chapa
    if (!user || !user.email) {
      return res.status(400).json({ 
        message: 'User email is required for payment processing' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user.email)) {
      return res.status(400).json({ 
        message: 'Invalid email format. Please update your profile with a valid email.' 
      });
    }

    console.log('💳 Initializing payment with user:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone
    });

    // Generate payment reference
    const txRef = generatePaymentReference();

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        paymentType,
        rentalId,
        userId: req.user.id,
        transactionId: txRef,
        gateway: 'chapa',
        dueDate: new Date(),
        status: 'PENDING'
      }
    });

    // Prepare Chapa payment data with defaults for optional fields
    const chapaData = {
      amount: parseFloat(amount),
      currency: 'ETB',
      email: user.email,
      first_name: user.firstName || 'Tenant',
      last_name: user.lastName || 'User',
      phone_number: user.phone || '0900000000',
      tx_ref: txRef,
      callback_url: `${process.env.FRONTEND_URL}/payment/callback`,
      return_url: `${process.env.FRONTEND_URL}/payment/success`,
      meta: {
        payment_id: payment.id,
        rental_id: rentalId,
        payment_type: paymentType
      },
      customization: {
        title: 'Homie Payment',
        description: description || `${paymentType} payment for rental`
      }
    };

    console.log('📤 Sending to Chapa:', JSON.stringify(chapaData, null, 2));

    // Initialize payment with Chapa
    const chapaResponse = await axios.post(`${CHAPA_URL}/transaction/initialize`, chapaData, {
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Update payment with Chapa response
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        gatewayResponse: chapaResponse.data
      }
    });

    console.log('✅ Chapa response:', chapaResponse.data);

    res.json({
      message: 'Payment initialized successfully',
      checkoutUrl: chapaResponse.data.data.checkout_url,
      data: {
        checkout_url: chapaResponse.data.data.checkout_url,
        tx_ref: txRef,
        payment_id: payment.id
      }
    });
  } catch (error) {
    console.error('❌ Payment initialization error:', error);
    console.error('Error details:', error.response?.data);
    if (error.response) {
      return res.status(400).json({ 
        message: 'Payment gateway error',
        error: error.response.data 
      });
    }
    res.status(500).json({ message: 'Server error during payment initialization' });
  }
});

// @route   POST /api/payments/verify/:txRef
// @desc    Verify payment with Chapa
// @access  Private
router.post('/verify/:txRef', [auth], async (req, res) => {
  try {
    const { txRef } = req.params;

    // Find payment record
    const payment = await prisma.payment.findUnique({
      where: { transactionId: txRef },
      include: {
        rental: {
          include: {
            property: true,
            tenant: true
          }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify with Chapa
    const chapaResponse = await axios.get(`${CHAPA_URL}/transaction/verify/${txRef}`, {
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`
      }
    });

    const verificationData = chapaResponse.data;

    if (verificationData.status === 'success' && verificationData.data.status === 'success') {
      // Payment successful
      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'COMPLETED',
          paidAt: new Date(),
          gatewayResponse: verificationData
        }
      });

      // Send notification to landlord
      const io = req.app.get('io');
      io.to(`landlord_${payment.rental.property.ownerId}`).emit('payment_received', {
        payment: updatedPayment,
        rental: payment.rental
      });

      res.json({
        message: 'Payment verified successfully',
        payment: updatedPayment
      });
    } else {
      // Payment failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          gatewayResponse: verificationData
        }
      });

      res.status(400).json({
        message: 'Payment verification failed',
        status: verificationData.data.status
      });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    if (error.response) {
      return res.status(400).json({ 
        message: 'Payment verification error',
        error: error.response.data 
      });
    }
    res.status(500).json({ message: 'Server error during payment verification' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Chapa webhook
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body;
    
    // Verify webhook signature (if configured)
    // const signature = req.headers['chapa-signature'];
    
    if (payload.event === 'charge.success') {
      const { tx_ref, status, amount } = payload.data;
      
      // Find and update payment
      const payment = await prisma.payment.findUnique({
        where: { transactionId: tx_ref }
      });

      if (payment && payment.status === 'PENDING') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: status === 'success' ? 'COMPLETED' : 'FAILED',
            paidAt: status === 'success' ? new Date() : null,
            gatewayResponse: payload
          }
        });
      }
    }

    res.status(200).json({ message: 'Webhook processed' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing error' });
  }
});

// @route   GET /api/payments/rental/:rentalId
// @desc    Get payments for a rental
// @access  Private
router.get('/rental/:rentalId', [auth], async (req, res) => {
  try {
    const { rentalId } = req.params;

    // Verify access to rental
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        property: true
      }
    });

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    // Check if user has access (tenant or landlord)
    if (rental.tenantId !== req.user.id && rental.property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to view these payments' });
    }

    const payments = await prisma.payment.findMany({
      where: { rentalId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ payments });
  } catch (error) {
    console.error('Get rental payments error:', error);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
});

// @route   GET /api/payments/my-payments
// @desc    Get current user's payments
// @access  Private
router.get('/my-payments', [auth], async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentType } = req.query;
    const skip = (page - 1) * limit;

    const where = { userId: req.user.id };
    
    if (status) {
      where.status = status;
    }
    
    if (paymentType) {
      where.paymentType = paymentType;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          rental: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  city: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get my payments error:', error);
    res.status(500).json({ message: 'Server error while fetching payments' });
  }
});

// @route   GET /api/payments/received
// @desc    Get payments received by landlord
// @access  Private (Landlord only)
router.get('/received', [auth], async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Get rentals owned by the user
    const userProperties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      select: { id: true }
    });

    const propertyIds = userProperties.map(p => p.id);

    const where = {
      rental: {
        propertyId: {
          in: propertyIds
        }
      }
    };

    if (status) {
      where.status = status;
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          rental: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  address: true,
                  city: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.payment.count({ where })
    ]);

    res.json({
      payments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get received payments error:', error);
    res.status(500).json({ message: 'Server error while fetching received payments' });
  }
});

// @route   GET /api/payments/analytics
// @desc    Get payment analytics for landlord
// @access  Private (Landlord only)
router.get('/analytics', [auth], async (req, res) => {
  try {
    // Get user's properties
    const userProperties = await prisma.property.findMany({
      where: { ownerId: req.user.id },
      select: { id: true }
    });

    const propertyIds = userProperties.map(p => p.id);

    if (propertyIds.length === 0) {
      return res.json({
        totalRevenue: 0,
        monthlyRevenue: 0,
        pendingPayments: 0,
        completedPayments: 0,
        chartData: []
      });
    }

    // Get payment statistics
    const [totalRevenue, monthlyRevenue, pendingCount, completedCount] = await Promise.all([
      prisma.payment.aggregate({
        where: {
          rental: { propertyId: { in: propertyIds } },
          status: 'COMPLETED'
        },
        _sum: { amount: true }
      }),
      prisma.payment.aggregate({
        where: {
          rental: { propertyId: { in: propertyIds } },
          status: 'COMPLETED',
          paidAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        },
        _sum: { amount: true }
      }),
      prisma.payment.count({
        where: {
          rental: { propertyId: { in: propertyIds } },
          status: 'PENDING'
        }
      }),
      prisma.payment.count({
        where: {
          rental: { propertyId: { in: propertyIds } },
          status: 'COMPLETED'
        }
      })
    ]);

    // Get monthly chart data for the last 6 months
    const chartData = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthlyData = await prisma.payment.aggregate({
        where: {
          rental: { propertyId: { in: propertyIds } },
          status: 'COMPLETED',
          paidAt: {
            gte: startOfMonth,
            lte: endOfMonth
          }
        },
        _sum: { amount: true },
        _count: true
      });

      chartData.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        revenue: monthlyData._sum.amount || 0,
        transactions: monthlyData._count
      });
    }

    res.json({
      totalRevenue: totalRevenue._sum.amount || 0,
      monthlyRevenue: monthlyRevenue._sum.amount || 0,
      pendingPayments: pendingCount,
      completedPayments: completedCount,
      chartData
    });
  } catch (error) {
    console.error('Get payment analytics error:', error);
    res.status(500).json({ message: 'Server error while fetching payment analytics' });
  }
});

// @route   POST /api/payments/manual-payment
// @desc    Record manual payment (for landlords)
// @access  Private (Landlord only)
router.post('/manual-payment', [auth], [
  body('rentalId').notEmpty().withMessage('Rental ID is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('paymentType').isIn(['RENT', 'DEPOSIT', 'MAINTENANCE', 'PENALTY']).withMessage('Invalid payment type'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { rentalId, amount, paymentType, description } = req.body;

    // Verify rental exists and user owns the property
    const rental = await prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        property: true,
        tenant: true
      }
    });

    if (!rental) {
      return res.status(404).json({ message: 'Rental not found' });
    }

    if (rental.property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Not authorized to record payment for this rental' });
    }

    // Create manual payment record
    const payment = await prisma.payment.create({
      data: {
        amount: parseFloat(amount),
        paymentType,
        rentalId,
        userId: rental.tenantId,
        transactionId: `MANUAL-${generatePaymentReference()}`,
        gateway: 'manual',
        status: 'COMPLETED',
        paidAt: new Date(),
        dueDate: new Date(),
        gatewayResponse: {
          method: 'manual',
          recorded_by: req.user.id,
          description: description || 'Manual payment recorded by landlord'
        }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        rental: {
          include: {
            property: {
              select: {
                id: true,
                title: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({
      message: 'Manual payment recorded successfully',
      payment
    });
  } catch (error) {
    console.error('Manual payment error:', error);
    res.status(500).json({ message: 'Server error while recording manual payment' });
  }
});

module.exports = router;