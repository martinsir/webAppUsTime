const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const mysql = require('mysql2');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

require('dotenv').config();

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

const lobbies = {}; // Store participants in each lobby for real-time display

db.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.stack);
        return;
    }
    console.log('Connected to MySQL database');
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('User connected');

    // Create a lobby
    socket.on('create_lobby', (userName) => {
        const lobbyID = Math.random().toString(36).substring(2, 8);
        db.query('INSERT IGNORE INTO users (username, email, password) VALUES (?, ?, ?)', [userName, `${userName}@example.com`, 'defaultpassword'], (err, result) => {
            if (err) throw err;

            const userID = result.insertId || 1;
            db.query('INSERT INTO conversations (type, status, lobby_id) VALUES (?, ?, ?)', ['Friendship', 'Active', lobbyID], (err, results) => {
                if (err) throw err;

                const conversationID = results.insertId;
                db.query('INSERT INTO participants (conversation_id, user_id, role) VALUES (?, ?, ?)', [conversationID, userID, 'Sender'], (err) => {
                    if (err) throw err;

                    lobbies[lobbyID] = [{ userID, userName }]; // Add initial user to the lobby in memory
                    socket.join(lobbyID);
                    socket.emit('lobby_created', lobbyID);
                    io.to(lobbyID).emit('user_joined', lobbies[lobbyID].map(user => user.userName)); // Update user list in lobby
                    console.log(`Lobby created with ID: ${lobbyID} by ${userName}`);
                });
            });
        });
    });

    // Join a lobby
    socket.on('join_lobby', (lobbyID, userName) => {
        db.query('SELECT id FROM conversations WHERE lobby_id = ?', [lobbyID], (err, results) => {
            if (err) throw err;

            if (results.length > 0) {
                const conversationID = results[0].id;
                db.query('INSERT IGNORE INTO users (username, email, password) VALUES (?, ?, ?)', [userName, `${userName}@example.com`, 'defaultpassword'], (err, result) => {
                    if (err) throw err;

                    const userID = result.insertId || 1;
                    db.query('INSERT INTO participants (conversation_id, user_id, role) VALUES (?, ?, ?)', [conversationID, userID, 'Receiver'], (err) => {
                        if (err) throw err;

                        // Update lobby with the new user
                        if (!lobbies[lobbyID]) lobbies[lobbyID] = [];
                        lobbies[lobbyID].push({ userID, userName });
                        
                        socket.join(lobbyID);
                        io.to(lobbyID).emit('user_joined', lobbies[lobbyID].map(user => user.userName)); // Send updated user list
                        console.log(`${userName} joined lobby ${lobbyID}`);
                    });
                });
            } else {
                socket.emit('error', 'Lobby not found');
            }
        });
    });

    // Send a message
    socket.on('send_message', (content) => {
        const lobbyID = Array.from(socket.rooms).find(room => room !== socket.id);

        db.query('SELECT id FROM conversations WHERE lobby_id = ?', [lobbyID], (err, results) => {
            if (err) throw err;

            if (results.length > 0) {
                const conversationID = results[0].id;
                const userID = lobbies[lobbyID].find(user => user.socketID === socket.id)?.userID || 1;

                db.query('INSERT INTO messages (conversation_id, user_id, content) VALUES (?, ?, ?)', [conversationID, userID, content], (err) => {
                    if (err) throw err;

                    io.to(lobbyID).emit('new_message', { username: lobbies[lobbyID].find(user => user.userID === userID).userName, content });
                    console.log(`Message sent in lobby ${lobbyID}: ${content}`);
                });
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
