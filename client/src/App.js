// --- Imports ---
import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
// We import our new, smaller components. App.js will decide which one to show.
import JoinScreen from './components/JoinScreen';
import PollRoom from './components/PollRoom';

// --- Socket.IO Connection ---
// This is our single, persistent connection to the backend server.
const socket = io('http://localhost:5000');

// This App.js file acts as the main 'controller' or 'brain' of our application.
// Its job is to manage all the state and logic, then pass that data down to
// the appropriate UI components as props.
function App() {
  // --- State Management ---
  // React will automatically re-render the UI to reflect the new state.
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null); // This is the master switch for what screen to show.
  const [votes, setVotes] = useState({ cats: 0, dogs: 0 });
  const [hasVoted, setHasVoted] = useState(false); // A simple flag to disable buttons after a user votes.
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [joinNotification, setJoinNotification] = useState('');

  // --- Side Effects & Server Communication ---

  // Effect #1: Handle page refreshes and session persistence.
  // This effect runs only ONCE when the app first loads.
  // Its job is to check if the user was already in a room and try to rejoin them automatically.
  useEffect(() => {
    const storedRoom = localStorage.getItem('poll-roomCode');
    const storedName = localStorage.getItem('poll-userName');
    const storedVoteInRoom = storedRoom ? localStorage.getItem(`poll-hasVoted-${storedRoom}`) : null;

    if (storedRoom && storedName) {
      setName(storedName);
      setRoomCode(storedRoom);
      socket.emit('joinRoom', { roomCode: storedRoom, userName: storedName });
      if (storedVoteInRoom) {
        setHasVoted(true);
      }
    }
  }, []);

  // This function handles the visual countdown for the user.
  // It's called whenever a user successfully creates or joins a room.
  const startTimer = () => {
    setTimeLeft(60);
    setVotingEnabled(true);
    setHasVoted(false); // Make sure voting is re-enabled for the new session.
    const interval = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(interval);
          setVotingEnabled(false);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Effect #2:.
  // It sets up all the listeners for messages coming *from* the server.
  useEffect(() => {
    // When the server confirms a room was created, update our state and start the timer.
    socket.on('roomCreated', (code) => {
      setJoinedRoom(code);
      localStorage.setItem('poll-roomCode', code);
      localStorage.setItem('poll-userName', name);
      startTimer();
    });

    // Same logic for when a user joins an existing room.
    socket.on('roomJoined', (code) => {
      setJoinedRoom(code);
      localStorage.setItem('poll-roomCode', code);
      localStorage.setItem('poll-userName', name);
      startTimer();
    });

    // When the server sends new vote counts, update our state to trigger a re-render.
    socket.on('updateVotes', (newVotes) => { setVotes(newVotes); });
    socket.on('updateUserList', (userList) => { setParticipants(userList); });
    // Display a temporary notification when a new user joins.
    socket.on('newUserAlert', (userName) => {
      setJoinNotification(`${userName} has joined the room!`);
      setTimeout(() => setJoinNotification(''), 3000);
    });
    // Display any error messages sent from the server.
    socket.on('error', (errorMessage) => {
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    });

    // The cleanup function: This is crucial! When the component unmounts or
    // re-renders, we remove the old listeners to prevent memory leaks and
    // duplicate event handlers from being registered.
    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('updateVotes');
      socket.off('updateUserList');
      socket.off('newUserAlert');
      socket.off('error');
    };
  }, [name]); // The [name] dependency means this effect will re-run if the user's name changes.

  // --- Event Handlers ---
  // These functions are called when the user clicks a button and are
  // responsible for sending messages *to* the server.

  const handleCreateRoom = () => {
    if (!name.trim()) return setError('Please enter your name.');
    const newRoomCode = Math.random().toString(36).substring(2, 8);
    socket.emit('createRoom', { roomCode: newRoomCode, userName: name });
  };

  const handleJoinRoom = () => {
    if (!name.trim() || !roomCode.trim()) return setError('Please enter your name and a room code.');
    socket.emit('joinRoom', { roomCode, userName: name });
  };

  const handleVote = (option) => {
    if (hasVoted || !votingEnabled) return;
    socket.emit('vote', { roomCode: joinedRoom, option, userName: name });
    setHasVoted(true);
    // We save the vote status in local storage to prevent voting again on refresh.
    localStorage.setItem(`poll-hasVoted-${joinedRoom}`, 'true');
  };

  // --- Render Logic ---
  // Because of our refactoring, App.js now acts as a 'router' or 'switchboard'.
  // It decides which component to show based on whether the user has joined a room.
  return (
    <div>
      { !joinedRoom ? (
        // If the user has NOT joined a room, show the JoinScreen.
        // We pass down all the necessary state and functions as props.
        <JoinScreen 
          name={name}
          setName={setName}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          handleCreateRoom={handleCreateRoom}
          handleJoinRoom={handleJoinRoom}
          error={error}
        />
      ) : (
        // Otherwise, show the main PollRoom.
        <PollRoom 
          participants={participants}
          joinedRoom={joinedRoom}
          votingEnabled={votingEnabled}
          timeLeft={timeLeft}
          joinNotification={joinNotification}
          handleVote={handleVote}
          votes={votes}
          hasVoted={hasVoted}
        />
      )}
    </div>
  );
}

export default App;
