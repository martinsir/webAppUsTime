// Importer nødvendige moduler
const express = require('express');        // Express framework til HTTP-forespørgsler
const http = require('http');              // HTTP server modul
const { Server } = require('socket.io');   // Socket.io til realtidskommunikation
const path = require('path');              // Path modul til at håndtere filstier
const mysql = require('mysql2');           // MySQL klient til databaseinteraktion
require('dotenv').config();                // dotenv til håndtering af miljøvariabler

// Initialiser Express app og HTTP server
const app = express();
const server = http.createServer(app);
const io = new Server(server);             // Initialiser Socket.io på HTTP serveren

// Server statiske filer fra mappen 'css'
app.use(express.static(path.join(__dirname, '../css')));

// Konfigurer databaseforbindelsen ved hjælp af miljøvariabler
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

// Midlertidigt lager til aktive lobbyer og deres deltagere
const lobbies = {};

// Forbind til MySQL databasen
db.connect((err) => {
    if (err) {
        console.error('Databaseforbindelse mislykkedes:', err.stack);
        return;
    }
    console.log('Forbundet til MySQL database');
});

// Server hoved HTML-filen på roden af applikationen
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html')); // Server `index.html` fra projektets rodmappe
});

// Håndter Socket.io forbindelser
io.on('connection', (socket) => {
    console.log('Bruger forbundet');

    // Håndter oprettelse af lobby
    socket.on('create_lobby', (userName) => {
        const lobbyID = Math.random().toString(36).substring(2, 8); // Generer et unikt lobby ID

        // Indsæt bruger i databasen, hvis de ikke allerede findes
        db.query('INSERT IGNORE INTO users (username, email, password) VALUES (?, ?, ?)', 
            [userName, `${userName}@example.com`, 'defaultpassword'], (err, result) => {
                if (err) throw err;

                const userID = result.insertId || 1; // Brug eksisterende userID hvis fundet

                // Indsæt en ny samtale med det genererede lobby ID
                db.query('INSERT INTO conversations (type, status, lobby_id) VALUES (?, ?, ?)', 
                    ['Friendship', 'Active', lobbyID], (err, results) => {
                        if (err) throw err;

                        const conversationID = results.insertId;

                        // Tilføj brugeren som 'Sender' i participants-tabellen
                        db.query('INSERT INTO participants (conversation_id, user_id, role) VALUES (?, ?, ?)', 
                            [conversationID, userID, 'Sender'], (err) => {
                                if (err) throw err;

                                // Initialiser lobby med den første bruger
                                lobbies[lobbyID] = [{ socketID: socket.id, userID, userName }];
                                socket.join(lobbyID); // Tilføj socket til lobby-rummet
                                socket.emit('lobby_created', lobbyID); // Informér brugeren om lobby ID
                                io.to(lobbyID).emit('user_joined', lobbies[lobbyID].map(user => user.userName)); // Opdater brugerliste i lobbyen
                                console.log(`Lobby oprettet med ID: ${lobbyID} af ${userName}`);
                            });
                    });
            });
    });

    // Håndter tilslutning til en eksisterende lobby
    socket.on('join_lobby', (lobbyID, userName) => {
        // Tjek om den angivne lobby findes i databasen
        db.query('SELECT id FROM conversations WHERE lobby_id = ?', [lobbyID], (err, results) => {
            if (err) throw err;

            if (results.length > 0) {
                const conversationID = results[0].id;

                // Indsæt bruger i databasen, hvis de ikke allerede findes
                db.query('INSERT IGNORE INTO users (username, email, password) VALUES (?, ?, ?)', 
                    [userName, `${userName}@example.com`, 'defaultpassword'], (err, result) => {
                        if (err) throw err;

                        const userID = result.insertId || 1;

                        // Tilføj brugeren som 'Receiver' i participants-tabellen
                        db.query('INSERT INTO participants (conversation_id, user_id, role) VALUES (?, ?, ?)', 
                            [conversationID, userID, 'Receiver'], (err) => {
                                if (err) throw err;

                                // Tilføj brugeren til lobbyen i hukommelsen
                                if (!lobbies[lobbyID]) lobbies[lobbyID] = [];
                                lobbies[lobbyID].push({ socketID: socket.id, userID, userName });

                                socket.join(lobbyID); // Tilslut socket til lobby-rummet
                                io.to(lobbyID).emit('user_joined', lobbies[lobbyID].map(user => user.userName)); // Opdater brugerliste i lobbyen
                                console.log(`${userName} tilsluttet lobby ${lobbyID}`);
                            });
                    });
            } else {
                socket.emit('error', 'Lobby findes ikke'); // Informér brugeren, hvis lobbyen ikke findes
            }
        });
    });

    // Håndter afsendelse af beskeder i en lobby
    socket.on('send_message', (content) => {
        const lobbyID = Array.from(socket.rooms).find(room => room !== socket.id); // Hent lobby ID for afsenderen

        db.query('SELECT id FROM conversations WHERE lobby_id = ?', [lobbyID], (err, results) => {
            if (err) throw err;

            if (results.length > 0) {
                const conversationID = results[0].id;
                const user = lobbies[lobbyID].find(user => user.socketID === socket.id); // Find brugeren via socket ID

                if (user) {
                    const { userID, userName } = user;

                    // Indsæt beskeden i messages-tabellen
                    db.query('INSERT INTO messages (conversation_id, user_id, content) VALUES (?, ?, ?)', 
                        [conversationID, userID, content], (err) => {
                            if (err) throw err;

                            io.to(lobbyID).emit('new_message', { username: userName, content }); // Send beskeden til lobbyen
                            console.log(`Besked sendt i lobby ${lobbyID} af ${userName}: ${content}`);
                        });
                } else {
                    console.error('Bruger ikke fundet i lobby'); // Log fejl hvis brugeren ikke er i lobbyen
                }
            }
        });
    });

    // Håndter afbrydelse af forbindelsen
    socket.on('disconnect', () => {
        for (const lobbyID in lobbies) {
            const index = lobbies[lobbyID].findIndex(user => user.socketID === socket.id);
            if (index !== -1) {
                const [removedUser] = lobbies[lobbyID].splice(index, 1); // Fjern bruger fra lobbyen
                io.to(lobbyID).emit('user_joined', lobbies[lobbyID].map(user => user.userName)); // Opdater brugerliste i lobbyen
                console.log(`${removedUser.userName} afbrød forbindelsen til lobby ${lobbyID}`);
            }
        }
        console.log('Bruger afbrød forbindelsen');
    });
});

// Start serveren og lyt på port 3000
server.listen(3000, () => {
    console.log('Server kører på http://localhost:3000');
});
