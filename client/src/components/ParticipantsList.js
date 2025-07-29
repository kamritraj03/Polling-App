import React from 'react';

function ParticipantsList({ participants }) {
  return (
    <div style={{ width: '200px', border: '1px solid #ccc', padding: '10px' }}>
      <h3>Participants ({participants.length})</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {participants.map(p => (
          <li key={p.id} style={{ color: p.hasVoted ? 'green' : 'black' }}>
            {p.name} {p.hasVoted ? '✓' : ''}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ParticipantsList;
