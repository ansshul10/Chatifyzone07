const express = require('express');
const router = express.Router();
const {
    getSettings,
    updatePrivacy,
    toggleMuteChat,
    exportData,
    deleteAccount,
    logoutOtherSessions
} = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');

// Handles both /api/settings and /api/settings/
router.get(['', '/'], protect, getSettings);

// Rest remains same...
router.put('/privacy', protect, updatePrivacy);
router.post('/mute-chat', protect, (req, res, next) => {
    req.method = 'POST';
    toggleMuteChat(req, res, next);
});
router.delete('/mute-chat', protect, (req, res, next) => {
    req.method = 'DELETE';
    toggleMuteChat(req, res, next);
});
router.get('/export', protect, exportData);
router.post('/delete-account', protect, deleteAccount);
router.post('/logout-other', protect, logoutOtherSessions);

module.exports = router;