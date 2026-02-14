const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    isEncrypted: { type: Boolean, default: false },
    timestamp: { type: String }, // Locale time string handle karne ke liye
    reactions: { type: [String], default: [] }, // Array of emojis
}, { timestamps: true });

module.exports = mongoose.model('Message', MessageSchema);