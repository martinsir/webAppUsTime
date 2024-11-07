const express = require('express'); // Import Express framework
const http = require('http'); // Import Node's HTTP module
const { Server } = require('socket.io'); // Import Socket.io for real-time communication
const { v4: uuidv4 } = require('uuid'); // Import UUID for unique ID generation

const app = express();
const server = http.createServer(app); // Create HTTP server
const io = new Server(server); // Add Socket.io to server

// In-memory object to store rooms
const rooms = {}; // Object to keep track of active rooms

// Handling new connections
io.on('connection', (socket) => {
    // Handle creating a new room
    socket.on('create_room', (userName) => {
        const roomID = uuidv4(); // Generate a unique ID for the room
        rooms[roomID] = [userName]; // Create the room and add the first user
        socket.join(roomID); // Add the user to the room
        socket.emit('room_created', roomID, rooms[roomID]); // Send room ID and users back to client
    });

    // Handle joining an existing room
    socket.on('join_room', (roomID, userName) => {
        if (rooms[roomID]) { // Check if the room exists
            rooms[roomID].push(userName); // Add user to the room
            socket.join(roomID); // Add the user to the room
            io.to(roomID).emit('user_joined', rooms[roomID]); // Update all in the room with new user
        } else {
            socket.emit('error', 'Room does not exist'); // Send error if room does not exist
        }
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        for (const roomID in rooms) {
            rooms[roomID] = rooms[roomID].filter((user) => user !== socket.id);
            if (rooms[roomID].length === 0) delete rooms[roomID]; // Delete room if empty
        }
    });
});

// Start server on port 3000
server.listen(3000, () => {
    console.log('Server listening on port 3000');
});
