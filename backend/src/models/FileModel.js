const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    file_name: { type: String, required: true },
    file_url: { type: String, required: true },
    file_type: { type: String, required: true },
    browser_id: { type: String, required: false },
    uploaded_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('File', fileSchema);