const socket = io();

console.log("Client script loaded, waiting for user actions...");

let currentStep = 0;
let isUserTurn = false;
let role = ""; // Track the role (either "Sender" or "Receiver") assigned to this user
let userName = ""; // Track this user's name

// Function to handle category selection
function startCategory(categoryName) {
    console.log("Selected category:", categoryName);
    document.getElementById('initialGreeting').style.display = 'none';
    document.querySelector('.category-section').style.display = 'none';
    document.getElementById('introSection').style.display = 'block'; // Vis introduktionen
    document.getElementById('backButton').style.display = 'block'; // Vis tilbage-knappen
}

// Funktion til at vise lobbyvalget efter introduktionen
function showLobbyOptions() {
    document.getElementById('introSection').style.display = 'none'; // Skjul introduktionen
    document.getElementById('lobbySelection').style.display = 'block'; // Vis lobbyvalget
}


// Function to show Create Lobby input fields
function showCreateLobby() {
    // Skjul lobby-valgsektionen og vis kun sektionen til at oprette lobby
    document.getElementById('lobbySelection').style.display = 'none';
    document.getElementById('createLobbySection').style.display = 'block';
    document.getElementById('backButton').style.display = 'block'; // Ensure Back button is visible
}

// Function to show Join Lobby input fields
function showJoinLobby() {
    // Skjul lobby-valgsektionen og vis kun sektionen til at tilslutte lobby
    document.getElementById('lobbySelection').style.display = 'none';
    document.getElementById('joinLobbySection').style.display = 'block';
    document.getElementById('backButton').style.display = 'block'; // Ensure Back button is visible
}

// Function to create a new lobby
function createLobby() {
    userName = document.getElementById('createName').value; // Store user name
    if (userName.trim()) {
        console.log("Creating lobby with username:", userName);
        socket.emit('create_lobby', userName);
        document.getElementById('createName').value = '';
    } else {
        alert("Please enter your name to create a lobby.");
    }
}

// Function to join an existing lobby
function joinLobby() {
    userName = document.getElementById('joinName').value; // Store user name
    const lobbyID = document.getElementById('joinLobbyID').value;

    if (userName.trim() && lobbyID.trim()) {
        console.log("Joining lobby with ID:", lobbyID, "and username:", userName);
        socket.emit('join_lobby', lobbyID, userName);
        document.getElementById('joinName').value = '';
        document.getElementById('joinLobbyID').value = '';
    } else {
        alert("Please enter both your name and the lobby ID to join.");
    }
}

// Function to show only the dialog section
function showDialogOnly() {
    // Skjul alle andre sektioner og vis kun dialogsektionen
    document.getElementById('createLobbySection').style.display = 'none';
    document.getElementById('joinLobbySection').style.display = 'none';
    document.getElementById('lobbySelection').style.display = 'none';
    document.getElementById('lobbyIDContainer').style.display = 'none';
    document.getElementById('dialogContainer').style.display = 'block';
    document.getElementById('backButton').style.display = 'none'; // Hide Back button in dialog view
}

// Handle lobby creation event
socket.on('lobby_created', (lobbyID) => {
    console.log("Lobby created with ID:", lobbyID);

    // Display the lobby ID to the creator
    const lobbyIDContainer = document.getElementById('lobbyIDContainer');
    document.getElementById('lobbyIDDisplay').innerText = `${lobbyID}`;
    lobbyIDContainer.style.display = 'block';

    // Hide the lobby creation section since the lobby is already created
    document.getElementById('createLobbySection').style.display = 'none';
    
    console.log("Invitation code displayed for the creator.");
});

// Handle user joined event and readiness message
socket.on('user_joined', (userList) => {
    console.log("Users in the lobby:", userList);

    const readinessMessage = document.getElementById('readinessMessage');

    // Check the number of users and display readiness messages
    if (userList.length === 1) {
        readinessMessage.innerText = "Waiting for another user to join...";
        readinessMessage.style.display = 'block';
    } else if (userList.length === 2) {
        readinessMessage.style.display = 'none';
        console.log("Both users joined; ready to start dialog");
    }
});

// Handle error messages from the server
socket.on('error', (message) => {
    alert(`Error: ${message}`);
    console.error(`Error received: ${message}`);
});

// Listen for dialog start event and set up roles and turn-based control
socket.on('start_dialog', (assignedRole) => {
    role = assignedRole; // Set this user's role
    console.log("Dialog started, assigned role:", role);

    // Show only the dialog section
    showDialogOnly();

    // Begin with the first step if this user is the first active participant
    isUserTurn = (role === dialogSteps[currentStep].role);
    updateDialogDisplay();
});

// Define dialog steps
const dialogSteps = [
    { role: "Sender", text: "Jeg vil gerne have en dialog, er nu et godt tidspunkt?" },
    { role: "Receiver", text: "Bekræfter tidspunkt eller finder et bedre tidspunkt." },
    { role: "Sender", text: "En ting jeg anerkender dig for/hos dig/ved dig…" },
    { role: "Receiver", text: "Spejle og tjekke med enten ”Er jeg hos/med dig?” eller ”Er der mere om det?”" },
    { role: "Sender", text: "Er du klar til at lytte?" },
    { role: "Receiver", text: "Bekræfter, ”Ja, jeg er klar til at lytte”." },
    { role: "Sender", text: "Det der nogle gange sker …/Det der rør sig for mig …" },
    { role: "Receiver", text: "Når der ikke er mere, sammenfatter modtager" },
    { role: "Receiver", text: "Fortæller hvad der giver mening (validering)." },
    { role: "Receiver", text: "Det der berørte mig ved det du sagde/det jeg så er …" },
    { role: "Sender", text: "Afrunding med gensidig værdsættelse." }
];

// Function to display each dialog step based on turn
function displayDialogStep(stepIndex) {
    const messageDisplay = document.getElementById('messageDisplay');
    const responseOptions = document.getElementById('responseOptions');

    if (stepIndex < dialogSteps.length) {
        const step = dialogSteps[stepIndex];
        console.log("Displaying dialog step:", step.text);
        
        // Display the role and name with each step
        messageDisplay.innerHTML = `<b>${role} (${userName}):</b> ${step.text}`;

        if (isUserTurn) {
            responseOptions.innerHTML = `<button onclick="nextDialogStep()">Næste</button>`;
        } else {
            responseOptions.innerHTML = ""; // Disable button if it's not this user's turn
        }
    } else {
        messageDisplay.innerHTML = "Dialog afsluttet. Tak for deltagelsen.";
        responseOptions.style.display = 'none';
    }
}

// Function to go back to the lobby selection screen
function goBackToLobbySelection() {
    document.getElementById('createLobbySection').style.display = 'none';
    document.getElementById('joinLobbySection').style.display = 'none';
    document.getElementById('lobbyIDContainer').style.display = 'none';
    document.getElementById('lobbySelection').style.display = 'none';
    document.getElementById('introSection').style.display = 'none'; // Skjul introduktionen
    document.getElementById('initialGreeting').style.display = 'block';

    const categorySection = document.querySelector('.category-section');
    categorySection.style.display = 'flex';

    document.getElementById('backButton').style.display = 'none';
}



// Function to go to the next dialog step and switch turns
function nextDialogStep() {
    currentStep++;
    isUserTurn = false; // Disable turn for this user after clicking

    // Notify the other user to proceed to the next step
    socket.emit('next_step', currentStep);

    // Update the dialog for this user
    displayDialogStep(currentStep);
}

// Listen for the next dialog step from the other user
socket.on('next_step', (stepIndex) => {
    currentStep = stepIndex;
    isUserTurn = (role === dialogSteps[currentStep].role); // Activate turn for this user if roles match

    updateDialogDisplay();
});

// Function to update dialog display based on turn
function updateDialogDisplay() {
    displayDialogStep(currentStep);
}
