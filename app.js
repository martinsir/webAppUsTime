const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Update these details to match your domain-hosted MySQL database
require('dotenv').config();
const mysql = require('mysql2');

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});


// Connect to the MySQL database
db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Store active lobbies in the database
io.on('connection', (socket) => {
    console.log('User connected');

    // When a user creates a lobby
    socket.on('create_lobby', (userName) => {
        const lobbyID = Math.random().toString(36).substring(2, 8); // Generate unique lobby ID

        // Insert the lobby into the database
        db.query('INSERT INTO conversations (type, status) VALUES (?, ?)', ['Friendship', 'Active'], (err, results) => {
            if (err) throw err;

            const conversationID = results.insertId;

            // Add the user as a participant in the lobby
            db.query('INSERT INTO participants (conversation_id, user_id, role) VALUES (?, ?, ?)', [conversationID, 1, 'Sender'], (err) => {
                if (err) throw err;

                socket.join(lobbyID); // Join the lobby room
                socket.emit('lobby_created', lobbyID); // Send lobby ID to the user
                console.log(`Lobby created with ID: ${lobbyID} by ${userName}`);
            });
        });
    });

    // When a user joins a lobby
    socket.on('join_lobby', (lobbyID, userName) => {
        db.query('SELECT id FROM conversations WHERE id = ?', [lobbyID], (err, results) => {
            if (err) throw err;

            if (results.length > 0) {
                const conversationID = results[0].id;

                db.query('INSERT INTO participants (conversation_id, user_id, role) VALUES (?, ?, ?)', [conversationID, 2, 'Receiver'], (err) => {
                    if (err) throw err;

                    socket.join(lobbyID);
                    io.to(lobbyID).emit('user_joined', userName);
                    console.log(`${userName} joined lobby ${lobbyID}`);
                });
            } else {
                socket.emit('error', 'Lobby not found');
            }
        });
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });
});

server.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
