// routes/serviceRoutes.js
const express = require('express');
const router = express.Router();
const Service = require('../model/serviceModel');
const { jwt_check_middleware } = require('../middlewares/jwt_check_middleware');

// Get all services (public)
router.get('/public', async (req, res) => {
  try {
    const services = await Service.find({ isActive: true })
      .select('name description category basePrice duration images features tags rating totalBookings')
      .lean();

    res.json({
      success: true,
      services
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all services (admin)
router.get('/', jwt_check_middleware, async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;
    
    const filter = {};

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      Service.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Service.countDocuments(filter)
    ]);

    // Get categories
    const categories = await Service.distinct('category');

    res.json({
      success: true,
      services,
      total,
      categories,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get single service
router.get('/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id).lean();
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({
      success: true,
      service
    });
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create service (admin)
router.post('/', jwt_check_middleware, async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      basePrice,
      duration,
      images,
      features,
      tags,
      options
    } = req.body;

    // Validate required fields
    if (!name || !description || !category || !basePrice || !duration) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields' 
      });
    }

    const service = new Service({
      name,
      description,
      category,
      basePrice,
      duration,
      images: images || [],
      features: features || [],
      tags: tags || [],
      options: options || []
    });

    await service.save();

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      service
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update service (admin)
router.put('/:id', jwt_check_middleware, async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    res.json({
      success: true,
      message: 'Service updated successfully',
      service
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Toggle service status (admin)
router.patch('/:id/toggle', jwt_check_middleware, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    service.isActive = !service.isActive;
    await service.save();

    res.json({
      success: true,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'} successfully`,
      service
    });
  } catch (error) {
    console.error('Toggle service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete service (admin)
router.delete('/:id', jwt_check_middleware, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    await service.deleteOne();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;