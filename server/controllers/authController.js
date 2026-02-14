const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * AUTH & PROFILE CONTROLLER v4.0 (Final Production Grade)
 * Features: E2EE Profile, Security Vault, Social Hierarchy, System Analytics
 */

// --- 1. REGISTER NEW USER ---
const register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Identity already exists." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({ 
            username, 
            email, 
            password: hashedPassword,
            analytics: { lastLogin: new Date(), loginCount: 1, totalTimeSpent: 0 }
        });

        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true, secure: true, sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        }).status(201).json({
            message: "Identity Established.",
            user: { id: newUser._id, username: newUser.username, email: newUser.email }
        });
    } catch (err) {
        console.error("Reg Error:", err);
        res.status(500).json({ error: "Handshake failed during registration." });
    }
};

// --- 2. LOGIN USER ---
const login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ error: "Identity not found." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Access Cipher Mismatch." });

        // Update Analytics on Login
        user.analytics.lastLogin = new Date();
        user.analytics.loginCount += 1;
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('token', token, {
            httpOnly: true, secure: true, sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000
        }).json({
            message: "Link Established.",
            user: { id: user._id, username: user.username, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ error: "Handshake failed." });
    }
};

// --- 3. GET FULL PROFILE (For Dashboard & Sync) ---
const getProfile = async (req, res) => {
    const { token } = req.cookies;
    if (!token) return res.json(null);

    try {
        jwt.verify(token, process.env.JWT_SECRET, {}, async (err, userData) => {
            if (err) return res.status(401).json(null);
            const user = await User.findById(userData.id)
                .select('-password -otp -sessions.token') // token mat bhejo security ke liye
                .populate('friends', 'username email profilePic');
            
            // Privacy included hai by default
            res.json({
                ...user.toObject(),
                privacy: user.privacy || {}, // ensure object hai
            });
        });
    } catch (err) {
        res.status(401).json(null);
    }
};

// --- 4. UPDATE IDENTITY (Bio, Age, Gender, Privacy) ---
const updateProfile = async (req, res) => {
    const userId = req.user.id;
    const { username, bio, age, gender, isPrivate } = req.body;
    try {
        const updatedUser = await User.findByIdAndUpdate(userId, {
            username, bio, age, gender, isPrivate
        }, { new: true, runValidators: true }).select('-password');
        
        res.json({ message: "Profile Synchronized", user: updatedUser });
    } catch (err) {
        res.status(500).json({ error: "Profile revision failed." });
    }
};

// --- 5. SECURITY VAULT (Password Change Logic) ---
const updatePassword = async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(userId);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid current access code." });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.json({ message: "Security Vault Updated Successfully." });
    } catch (err) {
        res.status(500).json({ error: "Vault rotation failed." });
    }
};

// --- 6. SOCIAL ENGINE (Follow, Request, Block) ---
const handleSocialAction = async (req, res) => {
    const { action, targetId } = req.body;
    const myId = req.user.id;

    try {
        const me = await User.findById(myId);
        const target = await User.findById(targetId);

        if (!target) return res.status(404).json({ error: "Target node not found." });

        if (action === "sendRequest") {
            if (target.friendRequests.includes(myId)) return res.json({ message: "Request already in queue." });
            target.friendRequests.push(myId);
            me.sentRequests.push(targetId);
        } 
        else if (action === "accept") {
            // Bi-directional link
            if (!me.friends.includes(targetId)) me.friends.push(targetId);
            if (!target.friends.includes(myId)) target.friends.push(targetId);
            
            // Cleanup requests
            me.friendRequests = me.friendRequests.filter(id => id.toString() !== targetId);
            target.sentRequests = target.sentRequests.filter(id => id.toString() !== myId);
        }
        else if (action === "unfriend") {
            me.friends = me.friends.filter(id => id.toString() !== targetId);
            target.friends = target.friends.filter(id => id.toString() !== myId);
        }
        else if (action === "block") {
            if (!me.blockedUsers.includes(targetId)) me.blockedUsers.push(targetId);
            // Remove from friends if blocking
            me.friends = me.friends.filter(id => id.toString() !== targetId);
        }

        await me.save();
        await target.save();
        res.json({ message: `Protocol ${action} executed successfully.` });
    } catch (err) {
        res.status(500).json({ error: "Neural link operation failed." });
    }
};

// --- 7. DISCOVERY NODES (Get All Users) ---
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, { 'password': 0, 'otp': 0, 'friendRequests': 0, 'sentRequests': 0 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: "Node scan failed." });
    }
};

// --- 8. SESSION TERMINATION (Logout) ---
const logout = async (req, res) => {
    res.clearCookie('token', { 
        httpOnly: true, 
        secure: true, 
        sameSite: 'none' 
    }).json({ message: "Session De-synced. Identity secured." });
};

module.exports = { 
    register, 
    login, 
    logout, 
    getProfile, 
    getAllUsers, 
    updateProfile, 
    updatePassword, 
    handleSocialAction 
};