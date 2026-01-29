const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    duration: {
        type: Number, // in hours
        required: true
    },
    category: {
        type: String,
        enum: ['cleaning', 'maintenance', 'repair', 'installation', 'other'],
        default: 'other'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    imageUrl: String,
    features: [String],
    totalBookings: {
        type: Number,
        default: 0
    },
    created_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Service', serviceSchema);




// // models/serviceModel.js
// const mongoose = require('mongoose');

// const serviceSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true
//   },
//   description: {
//     type: String,
//     required: true
//   },
//   category: {
//     type: String,
//     enum: ['residential', 'commercial', 'industrial', 'maintenance'],
//     required: true
//   },
//   basePrice: {
//     type: Number,
//     required: true
//   },
//   duration: {
//     type: Number, // in minutes
//     required: true
//   },
//   images: [{
//     type: String,
//     default: []
//   }],
//   features: [{
//     type: String,
//     default: []
//   }],
//   tags: [{
//     type: String,
//     default: []
//   }],
//   isActive: {
//     type: Boolean,
//     default: true
//   },
//   rating: {
//     type: Number,
//     default: 0,
//     min: 0,
//     max: 5
//   },
//   totalBookings: {
//     type: Number,
//     default: 0
//   },
//   options: [{
//     name: String,
//     price: Number,
//     duration: Number // additional minutes
//   }],
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   }
// });

// serviceSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// module.exports = mongoose.model('Service', serviceSchema);