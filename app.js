// Import required modules
const express = require('express');  // Express framework for handling HTTP requests
const http = require('http');        // HTTP server module
const { Server } = require('socket.io'); // Socket.io for real-time communication
const path = require('path');        // Path module to handle file paths
const mysql = require('mysql2');     // MySQL client for database interactions

// Initialize Express app and HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);       // Initialize Socket.io on the HTTP server

// Load environment variables from .env file
require('dotenv').config();

// Configure database connection using environment variables
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Temporary storage for active lobbies and their participants
const lobbies = {};

// Connect to the MySQL database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

// Serve the main HTML file on the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle Socket.io connections
io.on('connection', (socket) => {
    console.log('User connected');

    // Handle lobby creation
    socket.on('create_lobby', (userName) => {
        const lobbyID = Math.random().toString(36).substring(2, 8); // Generate unique lobby ID

        // Insert user if they don't already exist
        db.query('INSERT IGNORE INTO users (username, email, password) VALUES (?, ?, ?)', 
            [userName, `${userName}@example.com`, 'defaultpassword'], (err, result) => {
                if (err) throw err;

                const userID = result.insertId || 1; // Use existing userID if found

                // Insert a new conversation with generated lobby ID
                db.query('INSERT INTO conversations (type, status, lobby_id) VALUES (?, ?, ?)', 
                    ['Friendship', 'Active', lobbyID], (err, results) => {
                        if (err) throw err;

                        const conversationID = results.insertId;

                        // Add the user as a 'Sender' in the participants table
                        db.query('INSERT INTO participants (conversation_id, user_id, role) VALUES (?, ?, ?)', 
                            [conversationID, userID, 'Sender'], (err) => {
                                if (err) throw err;

                                // Initialize lobby with the first user
                                lobbies[lobbyID] = [{ socketID: socket.id, userID, userName }];
                                socket.join(lobbyID);               // Join the socket to the lobby room
                                socket.emit('lobby_created', lobbyID); // Notify user with lobby ID
                                io.to(lobbyID).emit('user_joined', lobbies[lobbyID].map(user => user.userName)); // Update user list
                                console.log(`Lobby created with ID: ${lobbyID} by ${userName}`);
                            });
                    });
            });
    });

    // Handle joining an existing lobby
    socket.on('join_lobby', (lobbyID, userName) => {
        // Check if the specified lobby exists
        db.query('SELECT id FROM conversations WHERE lobby_id = ?', [lobbyID], (err, results) => {
            if (err) throw err;

            if (results.length > 0) {
                const conversationID = results[0].id;

                // Insert the user if they don't already exist
                db.query('INSERT IGNORE INTO users (username, email, password) VALUES (?, ?, ?)', 
                    [userName, `${userName}@example.com`, 'defaultpassword'], (err, result) => {
                        if (err) throw err;

                        const userID = result.insertId || 1;

                        // Add user as a 'Receiver' in the participants table
                        db.query('INSERT INTO participants (conversation_id, user_id, role) VALUES (?, ?, ?)', 
                            [conversationID, userID, 'Receiver'], (err) => {
                                if (err) throw err;

                                // Add the user to the lobby in memory
                                if (!lobbies[lobbyID]) lobbies[lobbyID] = [];
                                lobbies[lobbyID].push({ socketID: socket.id, userID, userName });

                                socket.join(lobbyID); // Join the user to the socket room for the lobby
                                io.to(lobbyID).emit('user_joined', lobbies[lobbyID].map(user => user.userName)); // Update user list
                                console.log(`${userName} joined lobby ${lobbyID}`);
                            });
                    });
            } else {
                socket.emit('error', 'Lobby not found'); // Notify user if the lobby doesn't exist
            }
        });
    });

    // Handle sending messages within a lobby
    socket.on('send_message', (content) => {
        const lobbyID = Array.from(socket.rooms).find(room => room !== socket.id); // Get the lobby ID of the sender

        db.query('SELECT id FROM conversations WHERE lobby_id = ?', [lobbyID], (err, results) => {
            if (err) throw err;

            if (results.length > 0) {
                const conversationID = results[0].id;
                const user = lobbies[lobbyID].find(user => user.socketID === socket.id); // Find user by socket ID

                if (user) {
                    const { userID, userName } = user;

                    // Insert message into messages table
                    db.query('INSERT INTO messages (conversation_id, user_id, content) VALUES (?, ?, ?)', 
                        [conversationID, userID, content], (err) => {
                            if (err) throw err;

                            io.to(lobbyID).emit('new_message', { username: userName, content }); // Broadcast message to lobby
                            console.log(`Message sent in lobby ${lobbyID} by ${userName}: ${content}`);
                        });
                } else {
                    console.error('User not found in lobby'); // Log error if user is not in the lobby
                }
            }
        });
    });

    // Handle user disconnection
    socket.on('disconnect', () => {
        for (const lobbyID in lobbies) {
            const index = lobbies[lobbyID].findIndex(user => user.socketID === socket.id);
            if (index !== -1) {
                const [removedUser] = lobbies[lobbyID].splice(index, 1); // Remove user from lobby
                io.to(lobbyID).emit('user_joined', lobbies[lobbyID].map(user => user.userName)); // Update user list
                console.log(`${removedUser.userName} disconnected from lobby ${lobbyID}`);
            }
        }
        console.log('User disconnected');
    });
});

// Start the server and listen on port 3000
server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
