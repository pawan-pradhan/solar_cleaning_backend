const mongoose = require('mongoose');

const contact_settings_schema = new mongoose.Schema({
    mobile: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    whatsapp_no: {
        type: String,
    },
    telegram_username: {
        type: String,
    },
    facebook: {
        type: String,
    },
    youtube: {
        type: String,
    },
    instagram: {
        type: String,
    },
    other: {
        type: String,
    },
    insert_date: {
        type: Date,
        default: Date.now,
    },
});

const contact_settings_module = mongoose.model('contact_settings', contact_settings_schema);

module.exports = contact_settings_module;