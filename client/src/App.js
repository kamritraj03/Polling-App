import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import JoinScreen from './components/JoinScreen'; // Import the new component
import PollRoom from './components/PollRoom';   // Import the new component

const socket = io('http://localhost:5000');

function App() {
  // All state management remains here in the top-level component
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinedRoom, setJoinedRoom] = useState(null);
  const [votes, setVotes] = useState({ cats: 0, dogs: 0 });
  const [hasVoted, setHasVoted] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [votingEnabled, setVotingEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [joinNotification, setJoinNotification] = useState('');

  // All logic and useEffect hooks remain here
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

  const startTimer = () => {
    setTimeLeft(60);
    setVotingEnabled(true);
    setHasVoted(false);
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

  useEffect(() => {
    socket.on('roomCreated', (code) => {
      setJoinedRoom(code);
      localStorage.setItem('poll-roomCode', code);
      localStorage.setItem('poll-userName', name);
      startTimer();
    });

    socket.on('roomJoined', (code) => {
      setJoinedRoom(code);
      localStorage.setItem('poll-roomCode', code);
      localStorage.setItem('poll-userName', name);
      startTimer();
    });

    socket.on('updateVotes', (newVotes) => { setVotes(newVotes); });
    socket.on('updateUserList', (userList) => { setParticipants(userList); });
    socket.on('newUserAlert', (userName) => {
      setJoinNotification(`${userName} has joined the room!`);
      setTimeout(() => setJoinNotification(''), 3000);
    });
    socket.on('error', (errorMessage) => {
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    });

    return () => {
      socket.off('roomCreated');
      socket.off('roomJoined');
      socket.off('updateVotes');
      socket.off('updateUserList');
      socket.off('newUserAlert');
      socket.off('error');
    };
  }, [name]);

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
    localStorage.setItem(`poll-hasVoted-${joinedRoom}`, 'true');
  };

  // The render logic is now much cleaner
  return (
    <div>
      { !joinedRoom ? (
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
