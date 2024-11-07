const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Midlertidigt lager for lobbier (gemt i hukommelsen)
const lobbies = {};

// Servér HTML-filen
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Håndtér Socket.io forbindelse
io.on('connection', (socket) => {
    console.log('En bruger er forbundet');

    // Når en bruger opretter en lobby
    socket.on('create_lobby', (userName) => {
        const lobbyID = Math.random().toString(36).substring(2, 8); // Generér et unikt lobby-ID
        lobbies[lobbyID] = [userName]; // Opret lobbyen med brugerens navn
        socket.join(lobbyID); // Tilslut brugeren til lobbyen
        socket.emit('lobby_created', lobbyID); // Send lobby-ID'et tilbage til brugeren
        console.log(`Lobby oprettet med ID: ${lobbyID} af ${userName}`);
    });

    // Når en bruger forsøger at tilslutte sig en lobby
    socket.on('join_lobby', (lobbyID, userName) => {
        if (lobbies[lobbyID]) { // Tjek om lobby-ID eksisterer
            lobbies[lobbyID].push(userName); // Tilføj bruger til lobbyen
            socket.join(lobbyID); // Tilslut bruger til lobbyen
            io.to(lobbyID).emit('user_joined', lobbies[lobbyID]); // Send opdateret brugerlisten til alle i lobbyen
            console.log(`${userName} tilsluttet til lobby ${lobbyID}`);
        } else {
            socket.emit('error', 'Lobby findes ikke'); // Send fejl, hvis lobby-ID ikke eksisterer
        }
    });

    socket.on('disconnect', () => {
        console.log('En bruger har forladt forbindelsen');
    });
});

server.listen(3000, () => {
    console.log('Server kører på http://localhost:3000');
});
