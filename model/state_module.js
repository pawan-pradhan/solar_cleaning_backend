const mongoose = require('mongoose');

const state_schema = new mongoose.Schema({
    state_name: {
        type: String,
        required: true,
    },
    status: {
        type: Number,
        default: 1,
    },
    order_state: {
        type: Number,
        default: 1,
    },


    insert_date: {
        type: Date,
        default: Date.now,
    },
});

const state_module = mongoose.model('state', state_schema);

module.exports = state_module;