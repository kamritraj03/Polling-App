import React from 'react';

// This component receives all necessary functions and state as props from App.js
function JoinScreen({ name, setName, roomCode, setRoomCode, handleCreateRoom, handleJoinRoom, error }) {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1>Live Poll</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <input
        type="text"
        placeholder="Enter Your Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={{ padding: '10px', margin: '5px', width: '200px' }}
      />
      <hr style={{ margin: '20px auto', width: '300px' }} />
      <div>
        <button onClick={handleCreateRoom} style={{ padding: '10px 20px' }}>Create New Poll Room</button>
      </div>
      <p>OR</p>
      <div>
        <input
          type="text"
          placeholder="Enter Room Code"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
          style={{ padding: '10px', margin: '5px', width: '200px' }}
        />
        <button onClick={handleJoinRoom} style={{ padding: '10px 20px' }}>Join Room</button>
      </div>
    </div>
  );
}

export default JoinScreen;
