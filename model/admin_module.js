const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
    full_name: {
        type: String,
        required: true,
    },
    username: {
        type: String,
        required: true,
    },
    phone: {
        type: Number,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    admin_type: {
        type: Number,
        default: 1,
    },
    role: {
        type: String,
    },
    commission: {
        type: Number,
    },
    admin_email: {
        type: String,
        required: true,
    },
    wallet_amount: {
        type: Number,
        default: 0,
    },
    status: {
        type: Number,
        required: true,
    },
    accessMenus: {
        type: [String],
    },
    insert_date: {
        type: Date,
        default: Date.now,
    },
});

const admin_module = mongoose.model('admin', adminSchema);
 
module.exports = admin_module;