// routes/orderRoutes.js
const express = require('express');
const router = express.Router();
const Order = require('../model/orderModel');
const Service = require('../model/serviceModel');
const { jwt_check_middleware } = require('../middlewares/jwt_check_middleware');

// Get all orders (with filters) - ADMIN
router.get('/', jwt_check_middleware, async (req, res) => {
  try {
    const {
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { userPhone: { $regex: search, $options: 'i' } },
        { serviceName: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Calculate KPIs
    const kpis = await Order.aggregate([
      {
        $facet: {
          totalOrders: [{ $count: "count" }],
          pendingOrders: [{ $match: { status: "pending" } }, { $count: "count" }],
          inProgressOrders: [{ $match: { status: "in-progress" } }, { $count: "count" }],
          completedOrders: [{ $match: { status: "completed" } }, { $count: "count" }],
          totalRevenue: [{ $match: { status: "completed" } }, { $group: { _id: null, total: { $sum: "$totalAmount" } } }]
        }
      }
    ]);

    res.json({
      success: true,
      orders,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      kpis: {
        totalOrders: kpis[0]?.totalOrders[0]?.count || 0,
        pendingOrders: kpis[0]?.pendingOrders[0]?.count || 0,
        inProgressOrders: kpis[0]?.inProgressOrders[0]?.count || 0,
        completedOrders: kpis[0]?.completedOrders[0]?.count || 0,
        totalRevenue: kpis[0]?.totalRevenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single order
router.get('/:id', jwt_check_middleware, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create new order (from mobile app)
router.post('/create', async (req, res) => {
  try {
    const {
      userId,
      userName,
      userEmail,
      userPhone,
      userAddress,
      serviceId,
      scheduledDate,
      timeSlot,
      notes,
      paymentMethod
    } = req.body;

    // Validate required fields
    if (!userId || !userName || !userEmail || !userPhone || !userAddress || !serviceId || !scheduledDate || !timeSlot) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    // Get service details
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ 
        success: false, 
        message: 'Service not found' 
      });
    }

    // Create order
    const order = new Order({
      userId,
      userName,
      userEmail,
      userPhone,
      userAddress,
      serviceId,
      serviceName: service.name,
      servicePrice: service.basePrice,
      totalAmount: service.basePrice,
      scheduledDate: new Date(scheduledDate),
      timeSlot,
      notes: notes || '',
      paymentMethod: paymentMethod || 'cash'
    });

    await order.save();

    // Update service booking count
    service.totalBookings += 1;
    await service.save();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      order
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update order status
router.patch('/:id/status', jwt_check_middleware, async (req, res) => {
  try {
    const { status, notes, partnerAssigned } = req.body;
    
    const updateData = { status };
    
    if (notes) updateData.notes = notes;
    if (partnerAssigned) {
      updateData.partnerAssigned = partnerAssigned;
      updateData.partnerName = req.body.partnerName || '';
    }
    
    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.paymentStatus = 'paid';
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      order
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get dashboard KPIs
router.get('/dashboard/kpi', jwt_check_middleware, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [
      totalOrders,
      pendingOrders,
      completedOrders,
      monthlyRevenue,
      todayOrders,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: 'pending' }),
      Order.countDocuments({ status: 'completed' }),
      Order.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } }
      ]),
      Order.countDocuments({ createdAt: { $gte: startOfDay } }),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('orderId userName serviceName status totalAmount createdAt')
        .lean()
    ]);

    res.json({
      success: true,
      kpi: {
        totalOrders,
        pendingOrders,
        completedOrders,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        todayOrders,
        recentOrders: recentOrders.map(order => ({
          id: order.orderId,
          userName: order.userName,
          serviceName: order.serviceName,
          status: order.status,
          amount: order.totalAmount,
          createdAt: order.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Dashboard KPI error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;