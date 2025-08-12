const express = require('express');
const cors = require('cors');
// const fs = require('fs');
const socketIo = require('socket.io');

const app = express();

app.use(cors());
app.get('/', (req, res) => {
    res.send('hello, word!');
})

const server = app.listen(3000, () => {
    console.log('server is running on http://localhost:3000')
})

const io = socketIo(server, {
    path: '/ws',
    cors: {
        origin: "https://kek.bounceme.net",
        // origin: "http://localhost:3000",
        // origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: "*",
        credentials: true
    },
});

io.use((socket, next) => {
    const { roomId } = socket.handshake.query || {};
    if (!roomId) {
        socket.emit("error", "Shitty roomId");
        return next(new Error("Invalid roomId"));  
    }
    next();
});

// const WATCHROOM = "watchroom";
const rooms = {};
const socketToRoom = {};

io.on("connection", (/** @type {socketIo.RemoteSocket} */ socket) => {
    const { roomId } = socket.handshake.query;
    // const headers = socket.handshake.headers;
    // const ip = socket.handshake.address;

    console.log("Query Params:", socket.handshake.query);
    // console.log(`New connection: ${socket.id}`);


    socket.join(roomId);
    socketToRoom[socket.id] = roomId;

    // persist the new user in the room
    if (rooms[roomId]) {
        rooms[roomId].push({id: socket.id, name: socket.id});
    } else {
        rooms[roomId] = [{id: socket.id, name: socket.id}];
    }

    // sends a list of joined users to a new user
    const users = rooms[roomId].filter(user => user.id !== socket.id);
    socket.emit("room_users", users);
    socket.broadcast.to(roomId).emit("newUsedJoined", socket.id);
    console.log("[joined] room:" + roomId + " name: " + socket.id);
    

    socket.on("disconnect", () => {
        let room = rooms[roomId];
        if (room) {
            room = room.filter(user => user.id !== socket.id);
            rooms[roomId] = room;
        }
        socket.broadcast.to(room).emit("user_exit", {id: socket.id});
        console.log(`[${roomId}]: ${socket.id} exit`);
    });


    // socket.join(WATCHROOM);

    socket.on("playerEvent", (type, payload, callback) => {
        callback(`dicks are at ${Math.round(Math.random()*100)}%`);

        socket.broadcast.to(roomId).emit("getPlayerEvent", type, payload);
        console.log("payerEvent: ", type, socket.id);
    });

});