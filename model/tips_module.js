const mongoose = require('mongoose');

const tips_schema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    banner_image: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "file"
    },
    status: {
        type: Number,
        required: true,
    },


    insert_date: {
        type: Date,
        Default: Date.now,
    },
});

const tips_module = mongoose.model('tips', tips_schema);

module.exports = tips_module;