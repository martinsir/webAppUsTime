const socket = io();

// Function to toggle the navigation menu
function toggleMenu() {
    const navMenu = document.getElementById('navMenu');
    navMenu.classList.toggle('show-menu');
}

// Function to handle category selection
function startCategory(categoryName) {
    const lobbySection = document.getElementById('lobbySection');
    const initialGreeting = document.getElementById('initialGreeting');
    const lobbyIDContainer = document.getElementById('lobbyIDContainer');

    // Resetting the lobby display containers
    initialGreeting.style.display = 'none';
    lobbySection.style.display = 'none';
    lobbyIDContainer.style.display = 'none';

    if (categoryName === 'Par') {
        // Show lobby creation/join options for "Par"
        lobbySection.style.display = 'block';
        document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
    } else {
        alert(`You selected the category: ${categoryName}. Feature for this category is under development.`);
    }
}

// Function to create a new lobby
function createLobby() {
    const userName = document.getElementById('createName').value;
    if (userName.trim()) {
        socket.emit('create_lobby', userName);
        document.getElementById('createName').value = '';
    } else {
        alert("Please enter your name to create a lobby.");
    }
}

// Function to join an existing lobby
function joinLobby() {
    const userName = document.getElementById('joinName').value;
    const lobbyID = document.getElementById('joinLobbyID').value;

    if (userName.trim() && lobbyID.trim()) {
        socket.emit('join_lobby', lobbyID, userName);
        document.getElementById('joinName').value = '';
        document.getElementById('joinLobbyID').value = '';
    } else {
        alert("Please enter both your name and the lobby ID to join.");
    }
}

// Handle lobby creation event
socket.on('lobby_created', (lobbyID) => {
    // Hide the lobby creation/join section
    document.getElementById('lobbySection').style.display = 'none';

    // Display the lobby ID in a custom container
    const lobbyIDContainer = document.getElementById('lobbyIDContainer');
    document.getElementById('lobbyIDDisplay').innerText = `${lobbyID}`;
    lobbyIDContainer.style.display = 'block';
});

// Handle user joined event
socket.on('user_joined', (userList) => {
    const userListElement = document.getElementById('userList');
    userListElement.innerHTML = '';  // Clear the user list
    userList.forEach(user => {
        const li = document.createElement('li');
        li.textContent = user;
        userListElement.appendChild(li);
    });
});

// Handle error messages
socket.on('error', (message) => {
    document.getElementById('errorMessage').innerText = message;
});
