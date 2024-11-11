const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Store lobbies and their users
const lobbies = {};

// Serve static files from the root directory
app.use(express.static(path.join(__dirname, '')));

// Define route to serve the main HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle Socket.io connections
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Handle lobby creation
    socket.on('create_lobby', (userName) => {
        const lobbyID = Math.random().toString(36).substring(2, 8);

        // Initialize lobby with socket ID and username
        lobbies[lobbyID] = [{ id: socket.id, name: userName }];
        socket.join(lobbyID);

        // Send the lobby ID to the creator
        socket.emit('lobby_created', lobbyID);
        console.log(`Lobby created with ID: ${lobbyID} by user ${userName}`);
    });

    // Handle user joining an existing lobby
    socket.on('join_lobby', (lobbyID, userName) => {
        if (lobbies[lobbyID]) {
            if (lobbies[lobbyID].length < 2) {
                // Add the user to the lobby
                lobbies[lobbyID].push({ id: socket.id, name: userName });
                socket.join(lobbyID);

                // Emit the updated user list to the lobby
                const userList = lobbies[lobbyID].map(user => user.name);
                io.to(lobbyID).emit('user_joined', userList);
                console.log(`${userName} joined lobby ${lobbyID}`);

                // Start dialog when there are exactly two users in the lobby
                if (lobbies[lobbyID].length === 2) {
                    // Assign roles to users in the lobby
                    io.to(lobbies[lobbyID][0].id).emit('start_dialog', 'Sender'); // First user is "Sender"
                    io.to(lobbies[lobbyID][1].id).emit('start_dialog', 'Receiver'); // Second user is "Receiver"
                    console.log(`Starting dialog in lobby ${lobbyID} with turn-based roles`);
                }
            } else {
                socket.emit('error', 'Lobby is full');
                console.log(`Failed to join: Lobby ${lobbyID} is full`);
            }
        } else {
            socket.emit('error', 'Lobby not found');
            console.log(`Failed to join: Lobby ${lobbyID} not found`);
        }
    });

    // Handle progressing to the next step in the dialog
    socket.on('next_step', (stepIndex) => {
        // Find the lobby ID that this socket belongs to
        for (const lobbyID in lobbies) {
            const users = lobbies[lobbyID];
            if (users.some(user => user.id === socket.id)) {
                // Broadcast the next step to all users in the lobby
                io.to(lobbyID).emit('next_step', stepIndex);
                console.log(`Advancing to step ${stepIndex} in lobby ${lobbyID}`);
                break;
            }
        }
    });

    // Handle user disconnecting
    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);

        // Remove the user from any lobbies they joined
        for (const lobbyID in lobbies) {
            const index = lobbies[lobbyID].findIndex(user => user.id === socket.id);
            if (index !== -1) {
                const userName = lobbies[lobbyID][index].name;
                lobbies[lobbyID].splice(index, 1);

                console.log(`${userName} left lobby ${lobbyID}`);

                // Notify remaining users in the lobby about the updated user list
                const userList = lobbies[lobbyID].map(user => user.name);
                io.to(lobbyID).emit('user_joined', userList);

                // Check if the lobby should be deleted
                if (lobbies[lobbyID].length === 0) {
                    delete lobbies[lobbyID];
                    console.log(`Lobby ${lobbyID} deleted as it became empty`);
                } else {
                    io.to(lobbyID).emit('error', `${userName} has left the dialog. Please restart if necessary.`);
                }
                break;
            }
        }
    });
});

// Start the server on port 3000
server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
