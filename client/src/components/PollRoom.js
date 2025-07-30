import React from 'react';
import ParticipantsList from './ParticipantsList'; // Import the child component

function PollRoom({ participants, joinedRoom, votingEnabled, timeLeft, joinNotification, handleVote, votes, hasVoted }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-around', padding: '50px' }}>
      <ParticipantsList participants={participants} />
      
      <div style={{ textAlign: 'center', width: '500px' }}>
        <h1>Poll Room: {joinedRoom}</h1>
        {votingEnabled && <h2>Your Time Remaining: {timeLeft}s</h2>}
        {joinNotification && <p style={{ color: 'blue', fontStyle: 'italic' }}>{joinNotification}</p>}
        
        <h2>What's your favorite animal?</h2>
        <h2>Cats vs. Dogs</h2>
        <button onClick={() => handleVote('cats')} disabled={hasVoted || !votingEnabled} style={{ fontSize: '20px', margin: '10px', padding: '15px' }}>
          🐱 Cats ({votes.cats})
        </button>
        <button onClick={() => handleVote('dogs')} disabled={hasVoted || !votingEnabled} style={{ fontSize: '20px', margin: '10px', padding: '15px' }}>
          🐶 Dogs ({votes.dogs})
        </button>
        {hasVoted && <p>Thank you for voting!</p>}
        {!votingEnabled && <p style={{ color: 'red', fontWeight: 'bold' }}>Your voting time has ended!</p>}
      </div>
    </div>
  );
}

export default PollRoom;
