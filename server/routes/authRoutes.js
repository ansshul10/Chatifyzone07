const express = require('express');
const router = express.Router();
const { 
    register, 
    login, 
    logout, 
    getProfile, 
    getAllUsers, 
    updateProfile, 
    updatePassword, // Added for Security Vault
    handleSocialAction 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

/**
 * AUTH & SOCIAL ROUTES v4.0
 * Status: Production Ready
 */

// --- PUBLIC ACCESS NODES ---
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// --- PROTECTED SECURE NODES (Protect Middleware Applied) ---

// 1. Identity & Network Discovery
router.get('/profile', getProfile);
router.get('/users', getAllUsers);

// 2. Profile Revision (Bio, Age, Gender, Username)
router.put('/update', protect, updateProfile);

// 3. Security Vault (Password Rotation / Access Code Change)
router.put('/update-password', protect, updatePassword);

// 4. Social Hierarchy (Follow, Request, Block, Unfriend)
router.post('/social', protect, handleSocialAction);

module.exports = router;