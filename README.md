# Real-Time Poll Application

This is real-time polling application built with React, Node.js powered by WebSockets for live communication. Users can create a poll room, share a unique code, and have others join to vote in real-time.

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
*   **Backend**: Node.js with WebSockets


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


---


---

### Simulating Multiple Users & Rooms

To test the real-time features, you can simulate multiple users and rooms using separate incognito browser windows.

#### Scenario 1: Four Users in a Single Room

This tests the core real-time broadcasting to all participants in one room.

1.  Open an **incognito or private window** in four different web browsers (e.g., Chrome, Brave, Edge, Firefox).
2.  In each incognito window, navigate to `http://localhost:3000`.
3.  In the first window, have a user (e.g., Alice) create a new room and note the room code.
4.  In the other three windows, have Bob, Charles, and Daniel join the room using Alice's room code.
5.  As they vote, you will see the participant list and vote counts update in real-time across all four windows.

#### Scenario 2: Two Separate, Independent Rooms

This tests that rooms are properly isolated from each other.

1.  Using the four incognito windows from the setup above:
2.  **Room A**: In the first window, have **Alice** create a new room. Note the room code. In the second window, have **Bob** join Alice's room using that code.
3.  **Room B**: In the third window, have **Charles** create a **different** new room. In the fourth window, have **Daniel** join Charles's room using the new code.
4.  You will now observe that votes and participant updates in Room A are only visible to Alice and Bob, while Room B remains completely separate for Charles and Daniel. This demonstrates the effectiveness of the channel-based broadcasting logic.

---




