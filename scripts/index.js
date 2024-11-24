import { header } from "./header.js";
import {
    socket,
    startCategory,
    showLobbyOptions,
    showCreateLobby,
    showJoinLobby,
    createLobby,
    joinLobby,
    showDialogOnly,
    goBackToLobbySelection,
    nextDialogStep,
    updateDialogDisplay,
    displayDialogStep,
    dialogSteps
} from './app.js';

// Make functions accessible in the global scope
window.showCreateLobby = showCreateLobby;
window.showJoinLobby = showJoinLobby;
window.createLobby = createLobby;
window.joinLobby = joinLobby;
window.showDialogOnly = showDialogOnly;
window.goBackToLobbySelection = goBackToLobbySelection;
window.nextDialogStep = nextDialogStep;

// Added this index file and importing from other js files so 
// that we dont have 10 different scripts in the body of the html
window.onload = () => header();