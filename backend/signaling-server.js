const express = require('express');
const cors = require('cors');
const socketIo = require('socket.io')

const app = express();

app.use(cors());
app.get('/', (req, res) => {
    res.send('hello, word!');
})

const server = app.listen(3000, () => {
    console.log('server is running on http://localhost:3000')
})

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: "*",
        credentials: true
    },
});

const WATCHROOM = "watchroom";

io.on("connection", socket => {

    socket.join(WATCHROOM);

    socket.on("playerEvent", (type, payload, callback) => {
        callback(`dicks are at ${Math.round(Math.random()*100)}%`);

        socket.broadcast.to(WATCHROOM).emit("getPlayerEvent", type, payload);
        console.log("payerEvent: ", type, socket.id);
    });

});