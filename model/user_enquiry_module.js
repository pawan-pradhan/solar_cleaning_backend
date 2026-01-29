const mongoose = require('mongoose');

const user_enquiry_schema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true,
    },
    user_name: {
        type: String,
        required: true,
    },
    mobile: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    enquiry: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        required: true,
    },


    insert_date: {
        type: Date,
        default: Date.now,
    },
});

const user_enquiry_module = mongoose.model('user_enquiry', user_enquiry_schema);

module.exports = user_enquiry_module;