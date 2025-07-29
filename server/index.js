const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const rooms = {};
// The room object will no longer store timer info.
// Instead, each user object will store when they joined.

const updateRoomData = (roomCode) => {
  if (rooms[roomCode]) {
    io.to(roomCode).emit('updateUserList', rooms[roomCode].users);
    io.to(roomCode).emit('updateVotes', rooms[roomCode].votes);
  }
};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('createRoom', ({ roomCode, userName }) => {
    if (rooms[roomCode]) {
      socket.emit('error', 'Room with this code already exists.');
      return;
    }
    rooms[roomCode] = {
      // MODIFICATION: No more interval, endTime, or votingEnabled on the room.
      users: [{ 
        id: socket.id, 
        name: userName, 
        hasVoted: false, 
        joinTime: Date.now() // NEW: Track when this user joined.
      }],
      votes: { cats: 0, dogs: 0 },
    };

    // REMOVED: The entire setInterval block for the room timer is gone.

    socket.join(roomCode);
    socket.emit('roomCreated', roomCode);
    updateRoomData(roomCode);
  });

  socket.on('joinRoom', ({ roomCode, userName }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('error', 'Room not found.');
      return;
    }
    const userExists = room.users.some(user => user.name === userName);
    if (userExists) {
      socket.emit('error', 'This username is already taken in the room.');
      return;
    }
    
    // MODIFICATION: Add joinTime for the new user.
    room.users.push({ 
      id: socket.id, 
      name: userName, 
      hasVoted: false, 
      joinTime: Date.now() 
    });
    
    socket.join(roomCode);
    socket.emit('roomJoined', roomCode);
    
    io.to(roomCode).emit('newUserAlert', userName);
    updateRoomData(roomCode);
  });

  socket.on('vote', ({ roomCode, option, userName }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit('error', 'Room not found.');
      return;
    }

    const user = room.users.find(u => u.name === userName);
    if (!user) {
      socket.emit('error', 'You are not recognized in this room.');
      return;
    }

    // --- NEW PER-USER TIMER CHECK ---
    const timeSinceJoin = Date.now() - user.joinTime;
    if (timeSinceJoin > 60000) { // 60 seconds in milliseconds
      socket.emit('error', 'Your personal 60-second voting time has expired.');
      return;
    }
    // --- END NEW CHECK ---
    
    if (user.hasVoted) {
      socket.emit('error', 'You have already voted.');
      return;
    }

    user.hasVoted = true;
    room.votes[option]++;
    updateRoomData(roomCode);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const userIndex = room.users.findIndex(user => user.id === socket.id);
      
      if (userIndex !== -1) {
        room.users.splice(userIndex, 1);
        
        // MODIFICATION: The room only closes if empty. No timer to clear.
        if (room.users.length === 0) {
          delete rooms[roomCode];
          console.log(`Room ${roomCode} is now empty and has been closed.`);
        } else {
          io.to(roomCode).emit('userLeftAlert', 'A user');
          updateRoomData(roomCode);
        }
        break;
      }
    }
  });
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
