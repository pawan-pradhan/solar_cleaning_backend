const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        unique: true,
        default: () => `ORD${Date.now()}${Math.floor(Math.random() * 1000)}`
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    userPhone: {
        type: String,
        required: true
    },
    userAddress: {
        type: String,
        required: true
    },
    serviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Service',
        required: true
    },
    serviceName: {
        type: String,
        required: true
    },
    servicePrice: {
        type: Number,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    scheduledDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true,
        enum: ['morning', 'afternoon', 'evening']
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
        default: 'pending'
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'online', 'wallet'],
        default: 'cash'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    partnerAssigned: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    },
    partnerName: String,
    createdAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date
});

module.exports = mongoose.model('Order', orderSchema);








// // models/orderModel.js
// const mongoose = require('mongoose');

// const orderSchema = new mongoose.Schema({
//   orderId: {
//     type: String,
//     required: true,
//     unique: true
//   },
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   userName: {
//     type: String,
//     required: true
//   },
//   userEmail: {
//     type: String,
//     required: true
//   },
//   userPhone: {
//     type: String,
//     required: true
//   },
//   userAddress: {
//     type: String,
//     required: true
//   },
//   serviceId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Service',
//     required: true
//   },
//   serviceName: {
//     type: String,
//     required: true
//   },
//   servicePrice: {
//     type: Number,
//     required: true
//   },
//   status: {
//     type: String,
//     enum: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
//     default: 'pending'
//   },
//   totalAmount: {
//     type: Number,
//     required: true
//   },
//   scheduledDate: {
//     type: Date,
//     required: true
//   },
//   timeSlot: {
//     type: String,
//     required: true
//   },
//   partnerAssigned: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Partner'
//   },
//   partnerName: {
//     type: String
//   },
//   notes: {
//     type: String,
//     default: ''
//   },
//   paymentStatus: {
//     type: String,
//     enum: ['pending', 'paid', 'refunded'],
//     default: 'pending'
//   },
//   paymentMethod: {
//     type: String,
//     enum: ['cash', 'online', 'card'],
//     default: 'cash'
//   },
//   createdAt: {
//     type: Date,
//     default: Date.now
//   },
//   updatedAt: {
//     type: Date,
//     default: Date.now
//   },
//   completedAt: {
//     type: Date
//   },
//   cancellationReason: {
//     type: String
//   }
// });

// // Update updatedAt on save
// orderSchema.pre('save', function(next) {
//   this.updatedAt = Date.now();
//   next();
// });

// // Generate order ID before saving
// orderSchema.pre('save', async function(next) {
//   if (this.isNew) {
//     const count = await this.constructor.countDocuments();
//     this.orderId = `ORD${(count + 1).toString().padStart(6, '0')}`;
//   }
//   next();
// });

// module.exports = mongoose.model('Order', orderSchema);