// --- Getting our tools ready ---
// We're using Express for our basic server structure and Node's http module to power it.
const express = require('express');
const http = require('http');
// This is the core of our real-time functionality from the Socket.IO library.
const { Server } = require('socket.io');

// --- Setting up the server ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  // We need to configure CORS (Cross-Origin Resource Sharing) so that our
  // React app (running on localhost:3000) is allowed to connect to this server.
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// --- Our In-Memory "Database" ---
// This object will hold all our live poll rooms. It's simple and fast.
// Heads up: Since it's just a variable, all data will be lost if the server restarts.
const rooms = {};

// --- A Helper Function to Keep Things DRY (Don't Repeat Yourself) ---
// This function broadcasts the latest user list and vote counts to everyone in a room.
// We'll call this whenever the state of a room changes.
const updateRoomData = (roomCode) => {
  if (rooms[roomCode]) {
    io.to(roomCode).emit('updateUserList', rooms[roomCode].users);
    io.to(roomCode).emit('updateVotes', rooms[roomCode].votes);
  }
};

// --- Main Connection Logic: This runs for every single user who connects ---
io.on('connection', (socket) => {
  // `socket` represents the private, one-on-one connection to this specific user.
  console.log('A user connected:', socket.id);

  // --- Event Listener: When a user wants to create a new poll ---
  socket.on('createRoom', ({ roomCode, userName }) => {
    // First, a quick sanity check to make sure the room doesn't already exist.
    if (rooms[roomCode]) {
      socket.emit('error', 'Room with this code already exists.');
      return;
    }
    // If we're clear, let's create the room object in our main `rooms` ledger.
    rooms[roomCode] = {
      // The creator is the first user in the room.
      users: [{ 
        id: socket.id, 
        name: userName, 
        hasVoted: false, 
        joinTime: Date.now() // KEY: We stamp their entry time. This is the start of their personal 60-second timer.
      }],
      votes: { cats: 0, dogs: 0 },
    };

    // The logic for a shared room timer has been removed. Each user gets their own deadline.

    socket.join(roomCode); // Add the user to the private "channel" for this room.
    socket.emit('roomCreated', roomCode); // Let the creator know their room is ready.
    updateRoomData(roomCode); // And send them the initial state of the room.
  });

  // --- Event Listener: When a user wants to join an existing poll ---
  socket.on('joinRoom', ({ roomCode, userName }) => {
    const room = rooms[roomCode];
    // Check 1: Does this room actually exist?
    if (!room) {
      socket.emit('error', 'Room not found.');
      return;
    }
    // Check 2: Is this username already taken in this room? No duplicates allowed.
    if (room.users.some(user => user.name === userName)) {
      socket.emit('error', 'This username is already taken in the room.');
      return;
    }
    
    // If they pass the checks, add them to the user list for that room.
    room.users.push({ 
      id: socket.id, 
      name: userName, 
      hasVoted: false, 
      joinTime: Date.now() // Give this new user their own personal start time for their 60-second timer.
    });
    
    socket.join(roomCode); // Let them into the room's private channel.
    socket.emit('roomJoined', roomCode); // Send them a private confirmation.
    
    io.to(roomCode).emit('newUserAlert', userName); // Announce their arrival to everyone else.
    updateRoomData(roomCode); // And broadcast the updated state to the whole room.
  });

  // --- Event Listener: When a user casts a vote ---
  socket.on('vote', ({ roomCode, option, userName }) => {
    const room = rooms[roomCode];
    if (!room) return; // Fail silently if the room doesn't exist for some reason.

    // Find the specific user who is trying to vote.
    const user = room.users.find(u => u.name === userName);
    if (!user) {
      socket.emit('error', 'You are not recognized in this room.');
      return;
    }

    // SERVER-SIDE TIMER CHECK: This is the crucial part that enforces the deadline.
    const timeSinceJoin = Date.now() - user.joinTime;
    if (timeSinceJoin > 60000) { // 60 seconds in milliseconds
      socket.emit('error', 'Your personal 60-second voting time has expired.');
      return;
    }
    
    // Another check: Have they already voted? No double-dipping.
    if (user.hasVoted) {
      socket.emit('error', 'You have already voted.');
      return;
    }

    // If all checks passed, the vote is valid. Let's process it.
    user.hasVoted = true;       // Mark 'em as voted.
    room.votes[option]++;       // Tally the vote.
    updateRoomData(roomCode);   // And tell everyone the new score.
  });

  // --- Special Event: When a user disconnects (e.g., closes their browser) ---
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // We need to do some housekeeping. Let's find which room this user was in.
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const userIndex = room.users.findIndex(user => user.id === socket.id);
      
      // If we found them...
      if (userIndex !== -1) {
        // Remove them from the user list for that room.
        room.users.splice(userIndex, 1);
        
        // If the room is now empty, let's just delete it to save memory.
        if (room.users.length === 0) {
          delete rooms[roomCode];
          console.log(`Room ${roomCode} is now empty and has been closed.`);
        } else {
          // Otherwise, let the remaining users know someone left and update the state.
          io.to(roomCode).emit('userLeftAlert', 'A user has left');
          updateRoomData(roomCode);
        }
        break; // We found the user, so we can stop searching through other rooms.
      }
    }
  });
});

// --- And... we're live! Fire up the server on our chosen port. ---
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Backend server is up and running on http://localhost:${PORT}`);
});
