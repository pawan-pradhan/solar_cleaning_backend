const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    user_name: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    mobile: {
        type: String,
        required: true,
        unique: true,
        match: /^\d{10}$/
    },
    email: {
        type: String,
    },
    password: {
        type: String,
        required: true
    },
    security_pin: {
        type: String,
        default: '0000'
    },
    device_id: {
        type: String,
        default: ''
    },
    wallet_balance: {
        type: Number,
        default: 0
    },
    status: {
        type: Number,
        default: 1 // 0 = blocked, 1 = active
    },
    betting_status: {
        type: Number,
        default: 1 // 0 = inactive, 1 = active
    },
    logout_status: {
        type: Number,
        default: 0 // 0 = logged out, 1 = logged in
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', userSchema);