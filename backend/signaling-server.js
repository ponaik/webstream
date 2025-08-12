const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const socketIo = require('socket.io');

const MEDIA_PATH = "/Users/pon/Documents/code/webstream/hls";
const app = express();

app.use(cors());
app.get('/', (req, res) => {
    res.send('hello, word!');
})

const server = app.listen(3000, () => {
    console.log('server is running on http://localhost:3000')
})
// const server = https.createServer({
//     cert: fs.readFileSync('D:/web/cert/site.crt.pem'),
//     key:  fs.readFileSync('D:/web/cert/site.key.pem')
// });

// server.listen(443, () => {
//   console.log('Listening for HTTPS + WSS on port 443');
// });

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

const WATCHROOM = "watchroom";

io.on("connection", socket => {

    console.log(`New connection: ${socket.id}`);
    socket.emit("getAvailableMedia", getAvailableMedia());
    socket.join(WATCHROOM);

    socket.on("playerEvent", (type, payload, callback) => {
        callback(`dicks are at ${Math.round(Math.random()*100)}%`);

        socket.broadcast.to(WATCHROOM).emit("getPlayerEvent", type, payload);
        console.log("payerEvent: ", type, socket.id);
    });

});

function getAvailableMedia() {
    let availableMedia = [];

    fs.readdir(MEDIA_PATH, {}, (err, files) => {
        if (err) console.log(err);
        availableMedia = files.filter(val => !val.startsWith('.'));
    });

    return availableMedia;
}
