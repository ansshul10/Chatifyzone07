// server/index.js
// COMPLETE & FINAL VERSION - February 13, 2026
// All features integrated: Socket.IO real-time messaging, offline support, privacy settings via /api/settings
// Fixed: Removed deprecated mongoose options (useNewUrlParser, useUnifiedTopology)
// Added: Typing + read receipt socket events, global 404 handler, improved DB connection logging

require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const Message = require('./models/Message');
const User = require('./models/User');

const app = express();
const server = http.createServer(app);

// ────────────────────────────────────────────────
// SOCKET.IO CONFIGURATION - Stable & Reliable
// ────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: "https://chatifyzone07.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// ────────────────────────────────────────────────
// GLOBAL MIDDLEWARES
// ────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' })); // Increased limit for safety
app.use(cookieParser());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ────────────────────────────────────────────────
// DATABASE CONNECTION - MODERN & FIXED (no deprecated options)
// ────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 5000,   // Fail fast if Mongo unreachable
  maxPoolSize: 10                   // Good default for small/medium apps
})
  .then(() => {
    console.log("✅ DATABASE CONNECTED SUCCESSFULLY");
    console.log(`MongoDB Host: ${mongoose.connection.host}`);
    console.log(`Database Name: ${mongoose.connection.name}`);
  })
  .catch(err => {
    console.error("❌ DATABASE CONNECTION FAILED:");
    console.error("Error message:", err.message);
    console.error("Full error:", err);
    process.exit(1); // Exit if DB fails
  });

// Connection events for better debugging
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected - will attempt to reconnect');
});

// ────────────────────────────────────────────────
// ROUTES
// ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);  // System settings routes (privacy, mute, sessions, etc.)

// Public message history endpoint (used by frontend chat)
app.get('/api/messages/:userId/:myId', async (req, res) => {
  const { userId, myId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: myId, recipient: userId },
        { sender: userId, recipient: myId }
      ]
    })
      .sort({ createdAt: 1 })
      .limit(500); // Safety limit to prevent huge responses

    res.json(messages);
  } catch (err) {
    console.error("Messages Fetch Error:", err);
    res.status(500).json({ error: "Failed to fetch message history" });
  }
});

// ────────────────────────────────────────────────
// GLOBAL 404 HANDLER (helps debug missing routes)
// ────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.originalUrl}`,
    tip: "Check if route is defined in index.js or imported files"
  });
});

// ────────────────────────────────────────────────
// SOCKET.IO - QUANTUM CORE ENGINE (with privacy events)
// ────────────────────────────────────────────────
const onlineUsers = {}; // { userId: socket.id }

io.on('connection', (socket) => {
  console.log(`📡 New Socket Connection: ${socket.id}`);

  let connectedUserId = null;
  const startTime = Date.now();

  // 1. Register user
  socket.on('register_node', (userId) => {
    if (!userId) return;
    connectedUserId = userId;
    onlineUsers[userId] = socket.id;
    io.emit('get_online_nodes', Object.keys(onlineUsers));
    console.log(`👤 User ${userId} is now ONLINE (Socket: ${socket.id})`);
  });

  // 2. Send message (offline support - always save to DB)
  socket.on('send_message', async (payload) => {
    try {
      const { _id: tempId, ...messageData } = payload;

      const savedMessage = await Message.create({
        ...messageData,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });

      // Confirm to sender (replace temp message with real DB one)
      socket.emit('message_sent_confirm', {
        tempId,
        savedMsg: savedMessage
      });

      // Deliver to recipient if online
      const recipientSocketId = onlineUsers[messageData.recipient];
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_message', savedMessage);
      }
    } catch (err) {
      console.error("Message Save Failed:", err.message);
      socket.emit('message_error', { tempId, error: "Failed to save message" });
    }
  });

  // 3. Edit message
  socket.on('edit_message', async ({ _id, text, recipient }) => {
    try {
      const updated = await Message.findByIdAndUpdate(
        _id, 
        { text }, 
        { new: true }
      );

      if (!updated) return;

      const recipientSocket = onlineUsers[recipient];
      if (recipientSocket) {
        io.to(recipientSocket).emit('message_updated', updated);
      }
      socket.emit('message_updated', updated);
    } catch (e) {
      console.error("Edit Message Error:", e.message);
    }
  });

  // 4. Add reaction
  socket.on('react_message', async ({ msgId, emoji, recipient }) => {
    try {
      const updated = await Message.findByIdAndUpdate(
        msgId, 
        { $push: { reactions: emoji } }, 
        { new: true }
      );

      if (!updated) return;

      const recipientSocket = onlineUsers[recipient];
      if (recipientSocket) {
        io.to(recipientSocket).emit('message_updated', updated);
      }
      socket.emit('message_updated', updated);
    } catch (e) {
      console.error("Reaction Error:", e.message);
    }
  });

  // 5. Delete message
  socket.on('delete_message', async ({ msgId, recipient }) => {
    try {
      await Message.findByIdAndDelete(msgId);

      const recipientSocket = onlineUsers[recipient];
      if (recipientSocket) {
        io.to(recipientSocket).emit('message_deleted', msgId);
      }
      socket.emit('message_deleted', msgId);
    } catch (e) {
      console.error("Delete Message Error:", e.message);
    }
  });

  // 6. Typing indicator (new - privacy respected on frontend)
  socket.on('typing', ({ recipient }) => {
    const recipientSocket = onlineUsers[recipient];
    if (recipientSocket) {
      io.to(recipientSocket).emit('user_typing', { userId: connectedUserId });
    }
  });

  socket.on('stop_typing', ({ recipient }) => {
    const recipientSocket = onlineUsers[recipient];
    if (recipientSocket) {
      io.to(recipientSocket).emit('user_stop_typing', { userId: connectedUserId });
    }
  });

  // 7. Read receipts (new - mark messages as read)
  socket.on('messages_read', async ({ recipient, messageIds }) => {
    try {
      await Message.updateMany(
        { _id: { $in: messageIds }, recipient: connectedUserId },
        { $set: { read: true, readAt: new Date() } }
      );

      const recipientSocket = onlineUsers[recipient];
      if (recipientSocket) {
        io.to(recipientSocket).emit('messages_read_update', { 
          messageIds, 
          readBy: connectedUserId 
        });
      }
    } catch (err) {
      console.error("Read receipt update failed:", err.message);
    }
  });

  // 8. Disconnect + Analytics
  socket.on('disconnect', async () => {
    if (connectedUserId) {
      const endTime = Date.now();
      const timeInMinutes = Math.floor((endTime - startTime) / 60000);

      try {
        await User.findByIdAndUpdate(connectedUserId, {
          $inc: { "analytics.totalTimeSpent": timeInMinutes },
          "analytics.lastActive": new Date()
        });
        console.log(`📉 User ${connectedUserId} OFFLINE. Session: ${timeInMinutes} mins`);
      } catch (err) {
        console.error("Analytics Update Error:", err.message);
      }

      delete onlineUsers[connectedUserId];
      io.emit('get_online_nodes', Object.keys(onlineUsers));
    }

    console.log(`🔌 Socket Disconnected: ${socket.id}`);
  });
});

// ────────────────────────────────────────────────
// START SERVER
// ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Quantum Core Server running on PORT ${PORT}`);
  console.log(`Socket.IO ready at ws://localhost:${PORT}`);
  console.log(`API Base: http://localhost:${PORT}/api`);
});
