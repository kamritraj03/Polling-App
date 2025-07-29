# Real-Time Poll Application

This is real-time polling application built with React, Node.js, Express and powered by WebSockets for live communication. Users can create a poll room, share a unique code, and have others join to vote in real-time.

---

### Features Implemented

*   **Room Management**: Users can create a new, unique poll room or join an existing one using a room code.
*   **Live Voting**: Votes are broadcast instantly to all participants in the same room without needing to refresh the page.
*   **Live Participant List**: A side panel shows a list of all users in the room, which updates in real-time as users join or leave.
*   **Voting Status**: The participant list indicates who has already voted with a checkmark (✓).
*   **Personal Voting Timer**: Each user gets their own personal 60-second timer to cast their vote, which starts the moment they join the room.
*   **Vote Persistence**: The application uses `localStorage` to remember a user's vote status for a specific room, preventing them from voting again on a page refresh.
*   **Automatic Disconnection Handling**: If a user closes their browser, the server automatically removes them from the participant list and updates the room for everyone else.


---

### Tech Stack

*   **Frontend**: React.js
*   **Backend**: Node.js with Express.js
*   **Real-Time Communication**: Socket.IO (a WebSocket library)

---

### Setup Instructions

To run this project locally, you will need to have Node.js and npm installed.

**1. Backend Setup**

Navigate into the server directory
cd server

Install dependencies
npm install

Start the backend server (runs on http://localhost:5000)
node index.js


**2. Frontend Setup**
> Open a **new terminal window** for this step.

Navigate into the client directory from the project root
cd client

Install dependencies
npm install

Start the React development server (opens http://localhost:3000 in your browser)
npm start



