# Real-Time Chat Application

This is a real-time web-based chat application that allows users to join chat rooms, exchange messages, and experience smooth, interactive communication.

## Features

- **Real-Time Communication**:Users can chat in real-time without refreshing the page.
- **User Authentication**:Users can choose a unique username before joining a chat room.
- **Room Management**:Users can create new rooms or join existing ones.
- **Active Users List**:It is displayed when users enter room and leave room.
- **Responsive design**:The interface adjusts to different screen sizes.
- **Message Formatting**:The app supports basic text formatting (e.g., bold, italics, links). 
- **Audio Notifications**:Notifications are shown for new messages and when users join/leave the room. 
- **Cross-Tab Synchronization**:Changes made in one tab are automatically synchronized across all open tabs   
    for the same user.
- **Error Handling**:Proper error handling for cases like empty messages, room selection, and failed      
   websocket connnections. 
## Technologies Used

- Frontend:HTML,CSS,JavaScript
- Backend:Node.js,WebSockets 

## Installation and Running the Application Locally

- Follow these steps to run the application on your local machine:

## Prerequisites
Before running the app, make sure you have the following installed:

- [Node.js] (Version 14 or higher)
-  npm (npm comes with Node.js)

## Steps to Run Locally

1. **Clone the repository** 
  - Clone the repository to your local machine using the following command:
  - git clone https://github.com/Madhuri-tech9/chat-application.git
2. **Navigate into the Project Folder**:
  - After cloning, move to the project directory.
    cd chat-application
3. **Install dependencies**: Run this command to install the required dependencies:
  - npm install
4.  **Open the project folder in VS Code**:
  - Go to the public folder and click on index.html to open it.
5. **Start the Server**:
  - Open a new terminal in VS Code.
  - Type the following command to start the Node.js server:
    node server.js
  - This will start your server on port 3000.
6. **Launch the Application in the Browser**:
  - After starting the server, click on "Go Live" (bottom-right corner in VS Code).
  - The app will now open in your browser at http://127.0.0.1:5500/public/index.html



