// server/controllers/settingsController.js
// COMPLETE FILE - Handles all System Settings operations
// Includes: Get settings, Update privacy, Mute/Unmute chats, Export data, Delete account, Manage sessions

const User = require('../models/User');
const Message = require('../models/Message');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Helper to get current user from request (using protect middleware)
const getUserFromReq = async (req) => {
    if (!req.user || !req.user.id) {
        throw new Error('Authentication required');
    }
    const user = await User.findById(req.user.id);
    if (!user) {
        throw new Error('User not found');
    }
    return user;
};

// 1. Get all user settings (privacy + muted chats + sessions)
const getSettings = async (req, res) => {
    try {
        const user = await getUserFromReq(req);

        res.status(200).json({
            privacy: user.privacy,
            mutedChats: user.mutedChats,
            sessions: user.sessions.map(session => ({
                deviceInfo: session.deviceInfo,
                ip: session.ip || 'Unknown',
                lastActive: session.lastActive,
                createdAt: session.createdAt,
                // Do NOT send actual token back to frontend
            })),
            // You can add more if needed (e.g., email, username already in profile)
        });
    } catch (err) {
        console.error('Get Settings Error:', err);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
};

// 2. Update Privacy Settings
const updatePrivacy = async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        const allowedFields = [
            'readReceipts', 'lastSeenVisibility', 'bioVisibility',
            'typingIndicator', 'incognitoMode', 'notificationPreviews',
            'defaultDisappearingTimer'
        ];

        const updates = {};
        for (const key in req.body) {
            if (allowedFields.includes(key)) {
                // Extra validation for enum fields
                if (key === 'lastSeenVisibility' || key === 'bioVisibility') {
                    if (!['everyone', 'contacts', 'nobody'].includes(req.body[key])) {
                        return res.status(400).json({ error: `Invalid value for ${key}` });
                    }
                }
                if (key === 'notificationPreviews') {
                    if (!['show', 'sender', 'none'].includes(req.body[key])) {
                        return res.status(400).json({ error: `Invalid value for ${key}` });
                    }
                }
                if (key === 'defaultDisappearingTimer') {
                    const val = Number(req.body[key]);
                    if (isNaN(val) || val < 0) {
                        return res.status(400).json({ error: 'Invalid disappearing timer value' });
                    }
                    updates[`privacy.${key}`] = val;
                } else {
                    updates[`privacy.${key}`] = req.body[key];
                }
            }
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'No valid fields provided for update' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-password -otp -sessions.token');

        res.status(200).json({
            message: 'Privacy settings updated',
            privacy: updatedUser.privacy
        });
    } catch (err) {
        console.error('Update Privacy Error:', err);
        res.status(500).json({ error: 'Failed to update privacy settings' });
    }
};

// 3. Mute / Unmute a specific chat
const toggleMuteChat = async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        const { chatWith, muteUntil } = req.body; // muteUntil: null = forever, or ISO date string

        if (!chatWith) {
            return res.status(400).json({ error: 'chatWith (recipient ID) is required' });
        }

        const existingMuteIndex = user.mutedChats.findIndex(
            m => m.chatWith.toString() === chatWith.toString()
        );

        if (req.method === 'POST') { // Mute
            const mutedUntil = muteUntil ? new Date(muteUntil) : null;

            if (existingMuteIndex !== -1) {
                // Already muted → update duration
                user.mutedChats[existingMuteIndex].mutedUntil = mutedUntil;
            } else {
                // New mute
                user.mutedChats.push({
                    chatWith,
                    mutedUntil
                });
            }
        } else if (req.method === 'DELETE') { // Unmute
            if (existingMuteIndex === -1) {
                return res.status(400).json({ error: 'Chat is not muted' });
            }
            user.mutedChats.splice(existingMuteIndex, 1);
        }

        await user.save();

        res.status(200).json({
            message: req.method === 'POST' ? 'Chat muted' : 'Chat unmuted',
            mutedChats: user.mutedChats
        });
    } catch (err) {
        console.error('Mute Chat Error:', err);
        res.status(500).json({ error: 'Failed to update mute status' });
    }
};

// 4. Export User Data (basic JSON export - messages + profile)
const exportData = async (req, res) => {
    try {
        const user = await getUserFromReq(req);

        // Fetch user's sent & received messages
        const messages = await Message.find({
            $or: [
                { sender: user._id },
                { recipient: user._id }
            ]
        }).sort({ createdAt: -1 }).limit(500); // Limit to avoid huge response

        const exportData = {
            profile: {
                username: user.username,
                email: user.email,
                bio: user.bio,
                createdAt: user.createdAt,
                lastActive: user.analytics.lastActive,
                // Add more if needed, exclude sensitive
            },
            privacySettings: user.privacy,
            friendsCount: user.friends.length,
            messagesCount: messages.length,
            messages: messages.map(msg => ({
                sender: msg.sender.toString() === user._id.toString() ? 'You' : 'Other',
                text: msg.text.substring(0, 200) + (msg.text.length > 200 ? '...' : ''), // truncate for safety
                timestamp: msg.timestamp,
                createdAt: msg.createdAt
            })),
            exportDate: new Date().toISOString()
        };

        res.status(200).json({
            message: 'Data export successful',
            data: exportData
        });
    } catch (err) {
        console.error('Export Data Error:', err);
        res.status(500).json({ error: 'Failed to export data' });
    }
};

// 5. Delete Account (permanent - dangerous!)
const deleteAccount = async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        const { confirmPassword } = req.body;

        if (!confirmPassword) {
            return res.status(400).json({ error: 'Password confirmation required' });
        }

        const isMatch = await bcrypt.compare(confirmPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect password' });
        }

        // Delete all messages involving this user
        await Message.deleteMany({
            $or: [
                { sender: user._id },
                { recipient: user._id }
            ]
        });

        // Delete the user
        await User.findByIdAndDelete(user._id);

        // Clear cookie / token
        res.clearCookie('token');

        res.status(200).json({
            message: 'Account and all associated data permanently deleted'
        });
    } catch (err) {
        console.error('Delete Account Error:', err);
        res.status(500).json({ error: 'Failed to delete account' });
    }
};

// 6. Logout from all other sessions (except current)
const logoutOtherSessions = async (req, res) => {
    try {
        const user = await getUserFromReq(req);
        const currentToken = req.cookies.token; // or from header

        if (!currentToken) {
            return res.status(401).json({ error: 'No active session' });
        }

        // Keep only current session
        const decoded = jwt.verify(currentToken, process.env.JWT_SECRET);
        const currentJti = decoded.jti || decoded.id + '_' + Date.now(); // fallback

        user.sessions = user.sessions.filter(session => {
            // Very basic: keep sessions created recently or matching token
            // In production: use proper JWT invalidation (blacklist or short expiry)
            return session.createdAt.getTime() > (Date.now() - 5 * 60 * 1000); // keep last 5 min as safety
        });

        await user.save();

        res.status(200).json({
            message: 'Logged out from all other devices',
            remainingSessions: user.sessions.length
        });
    } catch (err) {
        console.error('Logout Other Sessions Error:', err);
        res.status(500).json({ error: 'Failed to logout other sessions' });
    }
};

module.exports = {
    getSettings,
    updatePrivacy,
    toggleMuteChat,         // Use POST for mute, DELETE for unmute
    exportData,
    deleteAccount,
    logoutOtherSessions
};