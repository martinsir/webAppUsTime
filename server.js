// server.js

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '')));

// Define route to serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle Socket.io connections
io.on('connection', (socket) => {
    console.log('User connected');

    // Handle lobby creation
    socket.on('create_lobby', (userName) => {
        const lobbyID = Math.random().toString(36).substring(2, 8);
        socket.join(lobbyID);
        socket.emit('lobby_created', lobbyID);
        io.to(lobbyID).emit('user_joined', [userName]);
        console.log(`Lobby created with ID: ${lobbyID}`);
    });

    // Handle user joining existing lobby
    socket.on('join_lobby', (lobbyID, userName) => {
        if (io.sockets.adapter.rooms.get(lobbyID)) {
            socket.join(lobbyID);
            io.to(lobbyID).emit('user_joined', [userName]);
            console.log(`${userName} joined lobby ${lobbyID}`);
        } else {
            socket.emit('error', 'Lobby not found');
        }
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
