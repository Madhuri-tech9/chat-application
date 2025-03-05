const WebSocket = require("ws");
const PORT = process.env.PORT || 3000; // Define PORT
const wss = new WebSocket.Server({ port: 3000 });
let users = {}; // Store usernames and their socket connections
let rooms = {}; // Store rooms and users in them

// When a client connects to the WebSocket server
wss.on("connection", (ws) => {
    let username = null;
    let currentRoom = null;

// Listen for incoming messages from the client
    ws.on("message", (message) => {
        const data = JSON.parse(message);

// Handle the case when a user tries to validate their username
    if (data.type === "validateUsername") {
// Check if the username is already taken
    if (users[data.username]) {
        ws.send(JSON.stringify({ type: "error", message: "Username is already taken. Choose another." }));
        return;
         }
            username = data.username;
            users[username] = ws;
            ws.send(JSON.stringify({ type: "info", message: `Welcome, ${username}!` }));
        }
// Handle room creation request
    if (data.type === "createRoom") {
       
// Only create the room if it doesn't exist
    if (!rooms[data.room]) {
    rooms[data.room] = [];
    broadcastRooms();
        }
    }

// Handle the case when a user tries to join a room
    if (data.type === "joinRoom") {
        const defaultRooms = ["General", "Sports", "Music"];

        // Ensure rooms object exists and initialize if undefined
    if (!rooms) {
        rooms = {};
    }
// Check if the room exists
    if (!rooms[data.room] && !defaultRooms.includes(data.room)) {
         ws.send(JSON.stringify({ type: "error", message: "Room does not exist." }));
             return;
 }

 // If the room does not exist in rooms, initialize it (only for custom rooms)
 if (!rooms[data.room]) {
    rooms[data.room] = [];
}
        
// Prevent a user from joining a room if they are already in another one
    if (currentRoom) {
         ws.send(JSON.stringify({ type: "error", message: "Leave the current room first." }));
            return;
            }
        
// Prevent same username from joining the same room in another tab
    const userExists = rooms[data.room].some((user) => user === data.username);
        
        if (userExists) {
// Send error only to the tab trying to rejoin
    ws.send(JSON.stringify({ type: "error", message: "You are already in this room from another tab!" }));
        
// Notify other clients (login pages) about the error
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN && client !== ws) {
            client.send(JSON.stringify({ type: "sameRoomError", message: `${data.username} is already in this room!` }));
                    }
         });
            return;
     }
     
// Allow the user to join if they are not already in the room
     rooms[data.room].push(username);
        currentRoom = data.room;
        broadcastUsers(currentRoom);
     }
        
// Handle the case when a user leaves a room
    if (data.type === "leaveRoom") {
         if (currentRoom && rooms[currentRoom]) {

// Remove the user from the room
    rooms[currentRoom] = rooms[currentRoom].filter((user) => user !== username);

        broadcastUsers(currentRoom);
    }
    currentRoom = null;
}

// Handle sending a message to the room
    if (data.type === "sendMessage" && currentRoom) {
         broadcastMessage(currentRoom, username, data.text);
        }
    });

// Handle the WebSocket connection closing
    ws.on("close", () => {
        if (username) delete users[username];
        if (currentRoom && rooms[currentRoom]) {
 // Remove the user from the current room when they disconnect
        rooms[currentRoom] = rooms[currentRoom].filter((user) => user !== username);
        // Broadcast a message to other users in the room that someone has left
        broadcastMessage(currentRoom, "System", `${username} has left the room.`);
        broadcastUsers(currentRoom);
    }
});

// Function to broadcast a message to all clients in a specific room
    function broadcastMessage(room, sender, text) {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "message", room, username: sender, text }));
            }
        });

    }
// Function to broadcast the list of active users in a specific room
    function broadcastUsers(room) {
        if (!rooms[room]) return;
        const usersInRoom = rooms[room];
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "activeUsers", users: usersInRoom }));
            }
        });
    }

// Function to broadcast the updated list of rooms
    function broadcastRooms() {
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: "updateRooms", rooms: Object.keys(rooms) }));
            }
        });
    }
});

console.log(`Server running on port ${PORT}`);
