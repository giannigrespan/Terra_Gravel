/**
 * WebSocket Service
 * Real-time messaging using Socket.io
 */

const { Server } = require('socket.io');
const { verifyToken } = require('../utils/auth');
const { query } = require('../config/database');

let io = null;

// Connected users map: { oderId: Set<socketId> }
const connectedUsers = new Map();

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 */
const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Verify JWT token
      const decoded = verifyToken(token);

      // Get user from database
      const result = await query(
        'SELECT id, username, is_active, is_banned FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return next(new Error('User not found'));
      }

      const user = result.rows[0];

      if (user.is_banned || !user.is_active) {
        return next(new Error('Account not accessible'));
      }

      // Attach user to socket
      socket.user = user;
      next();
    } catch (error) {
      console.error('[WS] Authentication error:', error.message);
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`[WS] User connected: ${socket.user.username} (${socket.id})`);

    // Add to connected users
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId).add(socket.id);

    // Join user's personal room
    socket.join(`user:${userId}`);

    // Update user's last_seen
    query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [userId]);

    // ==========================================
    // Event Handlers
    // ==========================================

    /**
     * Join a match room for real-time chat
     */
    socket.on('join_match', async (matchId) => {
      try {
        // Verify user is part of this match
        const match = await query(
          `SELECT id FROM matches
           WHERE id = $1 AND status = 'ACTIVE'
           AND (user_a_id = $2 OR user_b_id = $2)`,
          [matchId, userId]
        );

        if (match.rows.length === 0) {
          socket.emit('error', { message: 'Match not found or not accessible' });
          return;
        }

        socket.join(`match:${matchId}`);
        console.log(`[WS] ${socket.user.username} joined match:${matchId}`);

        // Notify room that user is online
        socket.to(`match:${matchId}`).emit('user_online', {
          matchId,
          userId,
          username: socket.user.username,
        });
      } catch (error) {
        console.error('[WS] Error joining match:', error.message);
        socket.emit('error', { message: 'Failed to join match' });
      }
    });

    /**
     * Leave a match room
     */
    socket.on('leave_match', (matchId) => {
      socket.leave(`match:${matchId}`);
      console.log(`[WS] ${socket.user.username} left match:${matchId}`);

      socket.to(`match:${matchId}`).emit('user_offline', {
        matchId,
        userId,
      });
    });

    /**
     * Send a message
     */
    socket.on('send_message', async (data) => {
      try {
        const { matchId, content } = data;

        if (!matchId || !content || content.trim() === '') {
          socket.emit('error', { message: 'Invalid message' });
          return;
        }

        // Verify user is part of this match
        const match = await query(
          `SELECT id, user_a_id, user_b_id FROM matches
           WHERE id = $1 AND status = 'ACTIVE'
           AND (user_a_id = $2 OR user_b_id = $2)`,
          [matchId, userId]
        );

        if (match.rows.length === 0) {
          socket.emit('error', { message: 'Match not found' });
          return;
        }

        // Insert message into database
        const result = await query(
          `INSERT INTO messages (match_id, sender_id, content)
           VALUES ($1, $2, $3)
           RETURNING id, match_id, sender_id, content, created_at`,
          [matchId, userId, content.trim()]
        );

        const message = result.rows[0];
        message.sender_username = socket.user.username;

        // Broadcast to match room (including sender for confirmation)
        io.to(`match:${matchId}`).emit('new_message', message);

        // Get recipient user ID
        const recipientId = match.rows[0].user_a_id === userId
          ? match.rows[0].user_b_id
          : match.rows[0].user_a_id;

        // Send push notification if recipient is not in room
        const recipientSockets = connectedUsers.get(recipientId);
        const recipientInRoom = recipientSockets && [...recipientSockets].some(socketId => {
          const recipientSocket = io.sockets.sockets.get(socketId);
          return recipientSocket && recipientSocket.rooms.has(`match:${matchId}`);
        });

        if (!recipientInRoom) {
          // Emit to user's personal room for notification
          io.to(`user:${recipientId}`).emit('notification', {
            type: 'new_message',
            matchId,
            senderId: userId,
            senderUsername: socket.user.username,
            preview: content.substring(0, 50),
          });
        }

        console.log(`[WS] Message sent in match:${matchId} by ${socket.user.username}`);
      } catch (error) {
        console.error('[WS] Error sending message:', error.message);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Typing indicator
     */
    socket.on('typing_start', (matchId) => {
      socket.to(`match:${matchId}`).emit('user_typing', {
        matchId,
        userId,
        username: socket.user.username,
      });
    });

    socket.on('typing_stop', (matchId) => {
      socket.to(`match:${matchId}`).emit('user_stopped_typing', {
        matchId,
        userId,
      });
    });

    /**
     * Mark messages as read
     */
    socket.on('mark_read', async (matchId) => {
      try {
        await query(
          `UPDATE messages
           SET read_at = NOW()
           WHERE match_id = $1 AND sender_id != $2 AND read_at IS NULL`,
          [matchId, userId]
        );

        socket.to(`match:${matchId}`).emit('messages_read', {
          matchId,
          readBy: userId,
          readAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error('[WS] Error marking messages as read:', error.message);
      }
    });

    /**
     * Get online status of users
     */
    socket.on('get_online_status', (userIds) => {
      const statuses = {};
      userIds.forEach(id => {
        statuses[id] = connectedUsers.has(id) && connectedUsers.get(id).size > 0;
      });
      socket.emit('online_status', statuses);
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', (reason) => {
      console.log(`[WS] User disconnected: ${socket.user.username} (${reason})`);

      // Remove from connected users
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);

          // Notify matches that user is offline
          socket.rooms.forEach(room => {
            if (room.startsWith('match:')) {
              socket.to(room).emit('user_offline', {
                matchId: room.replace('match:', ''),
                userId,
              });
            }
          });
        }
      }

      // Update last_seen
      query('UPDATE users SET last_seen_at = NOW() WHERE id = $1', [userId]);
    });

    /**
     * Error handler
     */
    socket.on('error', (error) => {
      console.error(`[WS] Socket error for ${socket.user.username}:`, error);
    });
  });

  console.log('[WS] WebSocket server initialized');
  return io;
};

/**
 * Get the Socket.io instance
 */
const getIO = () => io;

/**
 * Check if user is online
 */
const isUserOnline = (userId) => {
  return connectedUsers.has(userId) && connectedUsers.get(userId).size > 0;
};

/**
 * Get online users count
 */
const getOnlineUsersCount = () => connectedUsers.size;

/**
 * Send event to specific user
 */
const sendToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Send event to match room
 */
const sendToMatch = (matchId, event, data) => {
  if (io) {
    io.to(`match:${matchId}`).emit(event, data);
  }
};

/**
 * Broadcast to all connected users
 */
const broadcast = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeWebSocket,
  getIO,
  isUserOnline,
  getOnlineUsersCount,
  sendToUser,
  sendToMatch,
  broadcast,
};
