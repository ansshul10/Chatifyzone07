const Message = require('../models/Message');

// Messages fetch karne ke liye (Refresh par data nahi jayega)
const getMessages = async (req, res) => {
    const { userId } = req.params;
    const myId = req.user.id; // Token se aayega
    try {
        const messages = await Message.find({
            $or: [
                { sender: myId, recipient: userId },
                { sender: userId, recipient: myId }
            ]
        }).sort({ createdAt: 1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: "Failed to load chat history" });
    }
};

module.exports = { getMessages };