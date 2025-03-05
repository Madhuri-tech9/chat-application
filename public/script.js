// Establish WebSocket connection
const socket = new WebSocket("ws://localhost:3000");

socket.onopen = () => {
    console.log("WebSocket connection established.");
};

let currentRoom = null;
let username = null;

// Get references to HTML elements
const usernameInput = document.getElementById("usernameInput");
const startBtn = document.getElementById("startBtn");
const roomSelect = document.getElementById("roomSelect");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendMessageBtn = document.getElementById("sendMessageBtn");
const usersList = document.getElementById("usersList");
const newRoomInput = document.getElementById("newRoomInput");
const createRoomBtn = document.getElementById("createRoomBtn");
const currentRoomDisplay = document.getElementById("currentRoom");
const notificationSound = document.getElementById("notificationSound");
const welcomeMessageContainer = document.getElementById("welcomeMessage");

// Display Notifications (with Sound & Fade Effect)
function displayNotification(message, type = "info") {

    // Clear any existing timers to prevent overlap
    clearTimeout(welcomeMessageContainer.hideTimeout);
    welcomeMessageContainer.textContent = message;
    welcomeMessageContainer.style.display = "block";

    // Force reflow to restart animation
    void welcomeMessageContainer.offsetWidth; 
    welcomeMessageContainer.classList.remove("fadeOut"); 
    welcomeMessageContainer.classList.add("fadeIn");

    // Play notification sound if available
    if (notificationSound || type === "info") {
        notificationSound.volume = 1.0;
        notificationSound.muted = false;
        notificationSound.play().catch((e) => console.error("Audio playback failed:", e));
    }

   // Set a timeout to fade out after 5 seconds
   welcomeMessageContainer.hideTimeout = setTimeout(() => {
    welcomeMessageContainer.classList.remove("fadeIn");
    welcomeMessageContainer.classList.add("fadeOut");

    // Hide the notification completely after the fade-out duration 
    setTimeout(() => {
        welcomeMessageContainer.style.display = "none";
    }, 100);
}, 5000);
}

let isWelcomeMessageDisplayed = false;

// Handle username entry and login
startBtn.addEventListener("click", () => {
username = usernameInput.value.trim();
    if (!username) {
        displayNotification("Please enter a valid username.", "error");
        return;
    }

    if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "validateUsername", username }));

        document.querySelector(".login").style.display = "none";
        document.querySelector(".chat-container").style.display = "block";

// Display welcome message only once
    if (!isWelcomeMessageDisplayed) {
        welcomeMessageContainer.textContent = `Welcome ${username}!`;
        welcomeMessageContainer.style.display = "block";
        isWelcomeMessageDisplayed = true;

        setTimeout(() => {
        welcomeMessageContainer.style.display = "none";
            }, 3000);
        }
    } else {
        displayNotification("WebSocket connection is not open.", "error");
    }
});

// Handle room creation
    createRoomBtn.addEventListener("click", () => {
    const newRoom = newRoomInput.value.trim();
    if (newRoom && !Array.from(roomSelect.options).some((opt) => opt.value === newRoom)) {
        socket.send(JSON.stringify({ type: "createRoom", room: newRoom }));

 // Add new room to the dropdown list
    const option = document.createElement("option");
    option.value = newRoom;
    option.textContent = newRoom;
    roomSelect.appendChild(option);
    newRoomInput.value = "";

    displayNotification(`Room created by ${username}: ${newRoom}`, "success");
        usersList.innerHTML = "";
    } else {
        displayNotification("Please enter a unique room name.", "error");
    }
});

// Handle joining a room
    joinRoomBtn.addEventListener("click", () => {
    const room = roomSelect.value.trim();
    if (!room) {
      displayNotification("Please select a room to join.", "error");
        return;
    }

    if (currentRoom === room) {
       displayNotification("You are already in this room.", "error");
       return;
    }

    if (currentRoom) {
        displayNotification("Leave the current room before joining another.", "error");
        return;
    }
    
    if (room) {
        socket.send(JSON.stringify({ type: "joinRoom", username, room }));
        currentRoom = room;
        currentRoomDisplay.textContent = `Room: ${room}`;
        displayNotification(`${username} joined the room: ${room}`, "info");
    } else {
        displayNotification("Please select a room to join.", "error");
    }
});

// Handle leaving a room
    leaveRoomBtn.addEventListener("click", () => {
    if (currentRoom) {
        socket.send(JSON.stringify({ type: "leaveRoom", username, room: currentRoom }));
        currentRoom = null;
        chatMessages.innerHTML = "";
        currentRoomDisplay.textContent = "Room: Not Joined";
        roomSelect.value = "";

        localStorage.setItem("leftRoomNotification", `${username} has left the room`);
        displayNotification("You left the room.", "info");
        usersList.innerHTML = "";
    } else {
        displayNotification("You are not in any room.", "error");
    }
});

// Handle sending messages
    sendMessageBtn.addEventListener("click", () => {
    const message = messageInput.value.trim();
    if (!message || !currentRoom) {
        displayNotification("Cannot send an empty message.", "error");
        return;
    }

    if(message){
        displayNotification("message sent","info");
    }
    if (socket.readyState !== WebSocket.OPEN) {
        displayNotification("Connection lost. Reconnecting...", "error");
        return;
    }

    const timestamp = new Date().toLocaleTimeString();
    socket.send(JSON.stringify({ type: "sendMessage", room: currentRoom, username, text: message, timestamp }));
    messageInput.value = "";
});

// Send Message on pressing Enter Key
    messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendMessageBtn.click();
    }
});

// Handle Incoming WebSocket Messages
    socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "error") {
        displayNotification(data.message, "error");

        if (data.message.includes("Username is already taken")) {
            document.querySelector(".chat-container").style.display = "none";
            document.querySelector(".login").style.display = "block";

// Show error message in login screen
      const loginError = document.getElementById("loginError");
      loginError.textContent = "Username already exists! Try another.";
      loginError.style.display = "block";

    setTimeout(() => {
    loginError.style.display = "none";
        }, 5000);
    }
}

// Handle active users update
    if (data.type === "activeUsers") {
        usersList.innerHTML = "";
        data.users.forEach((user) => {
        const userElement = document.createElement("li");
         userElement.textContent = user;
        usersList.appendChild(userElement);
       });
    }

// Handle incoming messages
    if (data.type === "message" && data.text.trim() !== "") {
        if (data.room !== currentRoom) return;

        const messageElement = document.createElement("div");
        messageElement.classList.add("message");
        const timestamp = data.timestamp || new Date().toLocaleTimeString();
        messageElement.innerHTML = `<strong>${data.username}</strong> [${timestamp}]: ${formatMessage(data.text)}`;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

// Handle system message when a user leaves the room
     if (data.type === "message" && data.username === "System") {
// Display system message in the chat box 
        const messageElement = document.createElement("div");
        messageElement.classList.add("system-message");
        messageElement.textContent = data.text;
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (data.type === "info") {
        displayNotification(data.message, "info");
    }

    if (data.type === "error") {
        displayNotification(data.message, "error");
    }
};

// Handle Storage Events (Sync Across Tabs)
    window.addEventListener("storage", (e) => {
        if (e.key === "leftRoomNotification" && e.newValue) {
        if (currentRoom) {
            const messageElement = document.createElement("div");
            messageElement.classList.add("message");
            messageElement.innerHTML = `<strong>System</strong>: ${e.newValue}`;
            chatMessages.appendChild(messageElement);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }
});

// Format Text Messages
    function formatMessage(message) {
    message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/&/g, "&amp;");
    message = message.replace(/\*\*(.*?)\*\*/g, "<b>$1</b>");
    message = message.replace(/\*(.*?)\*/g, "<i>$1</i>");
    message = message.replace(/__(.*?)__/g, "<u>$1</u>");
    return message;
}

// WebSocket Error & Close Events
    socket.onerror = (error) => {
    console.error("WebSocket error:", error);
    displayNotification("WebSocket connection failed. Please refresh the page.", "error");
};

    socket.onclose = () => {
    displayNotification("WebSocket connection closed.", "error");
};
