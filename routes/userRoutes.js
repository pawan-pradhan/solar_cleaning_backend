// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../model/userModel');
const { jwt_check_middleware } = require('../middlewares/jwt_check_middleware');
const bcrypt = require('bcryptjs');

// Get all users (admin only)
router.get('/', jwt_check_middleware, async (req, res) => {
  try {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password') // Exclude password
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(filter)
    ]);

    // Calculate KPIs
    const kpis = await User.aggregate([
      {
        $facet: {
          totalUsers: [{ $count: "count" }],
          activeUsers: [{ $match: { status: "active" } }, { $count: "count" }],
          inactiveUsers: [{ $match: { status: "inactive" } }, { $count: "count" }],
          totalPartners: [{ $match: { role: "partner" } }, { $count: "count" }],
          todayRegistrations: [
            { 
              $match: { 
                createdAt: { 
                  $gte: new Date(new Date().setHours(0, 0, 0, 0))
                } 
              } 
            }, 
            { $count: "count" } 
          ]
        }
      }
    ]);

    res.json({
      success: true,
      users,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      kpis: {
        totalUsers: kpis[0]?.totalUsers[0]?.count || 0,
        activeUsers: kpis[0]?.activeUsers[0]?.count || 0,
        inactiveUsers: kpis[0]?.inactiveUsers[0]?.count || 0,
        totalPartners: kpis[0]?.totalPartners[0]?.count || 0,
        todayRegistrations: kpis[0]?.todayRegistrations[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single user
router.get('/:id', jwt_check_middleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create user (admin only)
router.post('/', jwt_check_middleware, async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      address,
      city,
      state,
      pincode,
      role,
      status
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, phone and password are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      address: address || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      role: role || 'user',
      status: status || 'active'
    });

    await user.save();

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user
router.put('/:id', jwt_check_middleware, async (req, res) => {
  try {
    const {
      user_name,
      email,
      phone,
      password,
      address,
      city,
      state,
      pincode,
      role,
      status
    } = req.body;

    const updateData = {};
    
    if (user_name) updateData.user_name = user_name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;
    if (address) updateData.address = address;
    if (city) updateData.city = city;
    if (state) updateData.state = state;
    if (pincode) updateData.pincode = pincode;
    if (role) updateData.role = role;
    if (status) updateData.status = status;
    
    // If password is provided, hash it
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Check if email or phone already exists for another user
    if (email || phone) {
      const existingUser = await User.findOne({
        $or: [
          email ? { email, _id: { $ne: req.params.id } } : {},
          phone ? { phone, _id: { $ne: req.params.id } } : {}
        ]
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email or phone already in use by another user'
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: 'User updated successfully',
      user
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update user status
router.patch('/:id/status', jwt_check_middleware, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid status is required' 
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete user
router.delete('/:id', jwt_check_middleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user has orders or other dependencies
    // Add checks here if needed

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get user KPIs for dashboard
router.get('/dashboard/kpi', jwt_check_middleware, async (req, res) => {
  try {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const oneWeekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      totalPartners,
      todayRegistrations,
      weekRegistrations,
      recentUsers
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ status: 1 }),
      User.countDocuments({ role: 'partner' }),
      User.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.countDocuments({ createdAt: { $gte: oneWeekAgo } }),
      User.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('name email phone role status createdAt')
        .lean()
    ]);

    res.json({
      success: true,
      kpi: {
        totalUsers,
        activeUsers,
        totalPartners,
        todayRegistrations,
        weekRegistrations,
        recentUsers: recentUsers.map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('User KPI error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;