// --- Import required modules ---
const http = require('http');
const { Server } = require('socket.io');

// --- Create the HTTP server ---
const server = http.createServer(); // No Express app needed since we don't serve HTTP routes

// --- Initialize Socket.IO server with CORS configuration ---
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // Allow only frontend origin to connect
    methods: ["GET", "POST"]          // Allowed HTTP methods during handshake
  }
});

// --- In-memory storage for poll rooms ---
const rooms = {};

// --- Helper to broadcast updated user list and votes within a room ---
const updateRoomData = (roomCode) => {
  if (rooms[roomCode]) {
    io.to(roomCode).emit('updateUserList', rooms[roomCode].users);
    io.to(roomCode).emit('updateVotes', rooms[roomCode].votes);
  }
};

// --- Handle new socket connections ---
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User creates a new poll room
  socket.on('createRoom', ({ roomCode, userName }) => {
    if (rooms[roomCode]) {
      socket.emit('error', 'Room with this code already exists.');
      return;
    }

    rooms[roomCode] = {
      users: [{
        id: socket.id,
        name: userName,
        hasVoted: false,
        joinTime: Date.now() // Start timer for this user
      }],
      votes: { cats: 0, dogs: 0 },
    };

    socket.join(roomCode);
    socket.emit('roomCreated', roomCode);
    updateRoomData(roomCode);
  });

  // User joins an existing poll room
  socket.on('joinRoom', ({ roomCode, userName }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('error', 'Room not found.');
      return;
    }
    if (room.users.some(user => user.name === userName)) {
      socket.emit('error', 'This username is already taken in the room.');
      return;
    }

    room.users.push({
      id: socket.id,
      name: userName,
      hasVoted: false,
      joinTime: Date.now() // Individual timer start
    });

    socket.join(roomCode);
    socket.emit('roomJoined', roomCode);

    io.to(roomCode).emit('newUserAlert', userName);
    updateRoomData(roomCode);
  });

  // User casts a vote
  socket.on('vote', ({ roomCode, option, userName }) => {
    const room = rooms[roomCode];
    if (!room) return;

    const user = room.users.find(u => u.name === userName);
    if (!user) {
      socket.emit('error', 'You are not recognized in this room.');
      return;
    }

    const timeSinceJoin = Date.now() - user.joinTime;
    if (timeSinceJoin > 60000) {
      socket.emit('error', 'Your personal 60-second voting time has expired.');
      return;
    }

    if (user.hasVoted) {
      socket.emit('error', 'You have already voted.');
      return;
    }

    user.hasVoted = true;
    room.votes[option]++;
    updateRoomData(roomCode);
  });

  // Handle user disconnecting
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const userIndex = room.users.findIndex(user => user.id === socket.id);

      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);

        if (room.users.length === 0) {
          delete rooms[roomCode];
          console.log(`Room ${roomCode} is now empty and has been closed.`);
        } else {
          io.to(roomCode).emit('userLeftAlert', 'A user has left');
          updateRoomData(roomCode);
        }
        break;
      }
    }
  });
});

// --- Start listening on port 5000 ---
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
