const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profilePic: { type: String, default: "" },
    
    // --- Profile Features (already tha) ---
    bio: { type: String, default: "Chatify user on a quantum link." },
    age: { type: Number, default: null },
    gender: { type: String, enum: ["male", "female", "other", "hidden"], default: "hidden" },
    isPrivate: { type: Boolean, default: false },

    // --- Social System (already tha) ---
    friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    friendRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // --- Analytics System (already tha) ---
    analytics: {
        totalTimeSpent: { type: Number, default: 0 }, // in minutes
        lastLogin: { type: Date, default: Date.now },
        lastActive: { type: Date, default: Date.now },
        loginCount: { type: Number, default: 0 }
    },
    
    // OTP System for Email/Security (already tha)
    otp: {
        code: { type: String },
        expiresAt: { type: Date }
    },

    // ────────────────────────────────────────────────
    // NEW: Privacy & Settings Fields (2026 standards)
    // ────────────────────────────────────────────────
    privacy: {
        // 1. Read Receipts (Blue Ticks)
        readReceipts: { type: Boolean, default: true },

        // 2. Last Seen & Online Status Visibility
        lastSeenVisibility: {
            type: String,
            enum: ['everyone', 'contacts', 'nobody'],
            default: 'everyone'
        },

        // 3. About / Bio Visibility
        bioVisibility: {
            type: String,
            enum: ['everyone', 'contacts', 'nobody'],
            default: 'everyone'
        },

        // 4. Typing Indicator
        typingIndicator: { type: Boolean, default: true },

        // 5. Incognito / Private Mode
        incognitoMode: { type: Boolean, default: false },

        // 6. Notification Previews
        notificationPreviews: {
            type: String,
            enum: ['show', 'sender', 'none'],
            default: 'show'
        },

        // 7. Default Self-Destructing Messages Timer (in seconds)
        // 0 = off, 86400 = 24h, 604800 = 7d, 2592000 = 30d
        defaultDisappearingTimer: { type: Number, default: 0 }
    },

    // 8. Mute Specific Chats
    mutedChats: [{
        chatWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        mutedUntil: { type: Date, default: null } // null = forever
    }],

    // 9. Active Sessions / Device Management
    sessions: [{
        deviceInfo: { type: String },          // e.g. "Chrome 120 on Windows 11"
        ip: { type: String },
        lastActive: { type: Date, default: Date.now },
        token: { type: String },               // JWT token ya hashed version
        createdAt: { type: Date, default: Date.now }
    }]

}, { 
    timestamps: true 
});

// Optional: Index for faster queries on mutedChats & sessions
userSchema.index({ 'mutedChats.chatWith': 1 });
userSchema.index({ 'sessions.token': 1 });

module.exports = mongoose.model('User', userSchema);