import './style.css';
import player from "./main-video.js";
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000', {
    transports: ['websocket', 'polling', 'flashsocket'],
    cors: {
        origin: "http://localhost:3000",
        credentials: true
    },
    withCredentials: true
});

console.log(player);

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
const peerConnection = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;
let eventsChannel = null;

// HTML elements
const localVideo = document.getElementById('webcamVideo');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');
const chatButton = document.getElementById('chatButton');
const sendButton = document.getElementById('send');

remoteStream = new MediaStream();
remoteVideo.srcObject = remoteStream;

// 0. Setup my asshole

document.addEventListener('keydown', (event) => {
  console.log(`Key pressed: ${event.key}`);
});

// 1. Setup media sources

// event channel creation
chatButton.onclick = () => {
  eventsChannel = peerConnection.createDataChannel('events', {
    ordered: false
  });

  console.log("Event channel init attempt...");

  eventsChannel.onopen = handleDataChannelOpen;
  eventsChannel.onmessage = handleEvent;
}

sendButton.onclick = () => {
  emitEvent("dicks", {one: "two"});
}

// Emitting an event
function emitEvent(type, payload={}) {
  // if (eventsChannel) {
  //   eventsChannel.send(JSON.stringify({ type, payload }));
  // }

  if (Date.now() - lastEventMillis < eventTimeoutPeriod) {
      console.log("Emit event aborted for: ", type);
      return;
    }

    payload['timestamp'] = Date.now();

    console.log("Sending event: ", type);
    socket.emit("playerEvent", type, payload, (present) => {
      console.log("callback from server ??? A present: ", present);
    });
}

let lastEventMillis = Date.now();
const eventTimeoutPeriod = 100;

function handleEvent(type, payload) {
  // let { type, payload } = JSON.parse(event.data);
  const transportTime = Date.now() - payload['timestamp'];
  console.log(`Received event: ${type} in ${transportTime} ms, `, payload);
  lastEventMillis = Date.now();

  switch (type) {
    case 'pause':
      player.pause();
      break;
    case 'play':
      player.play();
      break;
    case 'seeked':
      const wasPlaying = !player.paused();
      
      if (wasPlaying) {
        player.pause();
      }

      player.currentTime(payload['time']);

      if (wasPlaying) {
        player.play();
      }

      break;
    case 'sanityCheck':
      const localTime = player.currentTime();
      const remoteTime = payload['currentTime'] + transportTime/1000;
      const timeDiff = localTime - remoteTime;
      console.log(`${Math.abs(timeDiff) > 2 ? '!!!!!!!!!':''} TimeDiff: ${timeDiff}`);
      break;
    default:
      console.log("It's dicks isn't it. (it's: ", type, ")");
      break;
  }
}

function handleDataChannelOpen() {
  setInterval(() => {
    const payload = {
      'currentTime': player.currentTime()
    }
    emitEvent('sanityCheck', payload);
  }, 30 * 1000)
  console.log('Events channel open');
}

player.on('play', () => emitEvent('play'));
player.on('pause', () => emitEvent('pause'));
player.on('seeked', () => emitEvent('seeked', {'time': player.currentTime()}));



// Socket.io-client handling webrtc connection
socket.on('connect', () => {
  console.log('Hello, successfully connected to the signaling server!');
});

socket.on("room_users", (users) => {
  console.log("Current room users: ", users);
  if (users.length) {
    createOffer();
  }
});

socket.on("getOffer", (sdp) => {
  // console.log("get offer:", sdp);
  console.log("Received offer");
  createAnswer(sdp);
});

socket.on("getAnswer", (sdp) => {
  // console.log("Received answer: ", sdp);
  console.log("Received answer: ");
  peerConnection.setRemoteDescription(sdp);
});

socket.on("getCandidate", (candidate) => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).then(() => {
    console.log("Added new remote ICE canditate: ", candidate.candidate);
  });
});

socket.on("getPlayerEvent", handleEvent);

const createOffer = () => {
    console.log("Creating offer...");
    peerConnection
        .createOffer()
        .then(sdp => {
            peerConnection.setLocalDescription(sdp);
            socket.emit("offer", sdp);
        })
        .catch(error => {
            console.log(error);
        });
};

const createAnswer = (sdp) => {
    peerConnection.setRemoteDescription(sdp).then(() => {
        console.log("Remote description set");
        peerConnection
            .createAnswer()
            .then(sdp1 => {
                console.log("Creating answer...");
                peerConnection.setLocalDescription(sdp1);
                socket.emit("answer", sdp1);
            })
            .catch(error => {
                console.log(error);
            });
    });
};

async function init(e) {
    console.log("init");
    try {
        navigator.mediaDevices
            .getDisplayMedia({
                video: true,
                audio: true,
            })
            .then(stream => {
                localVideo.srcObject = stream;

                stream.getTracks().forEach(track => {
                    peerConnection.addTrack(track, stream);
                });
                peerConnection.onicecandidate = e => {
                    if (e.candidate) {
                        console.log("New local ICE: ", e.candidate.candidate);
                        socket.emit("candidate", e.candidate);
                    }
                };
                peerConnection.oniceconnectionstatechange = e => {
                    console.log("ICE state change: ", e.target);
                };

                peerConnection.ontrack = (event) => {
                  event.streams[0].getTracks().forEach((track) => {
                    remoteStream.addTrack(track);
                  });
                };

                // channel isn't opening for some reason
                peerConnection.ondatachannel = event => {
                  eventsChannel = event.channel;
                  eventsChannel.onopen    = handleDataChannelOpen;
                  eventsChannel.onmessage = handleEvent;
                };

                socket.emit("join", {
                    room: "1234",
                    name: "skydoves@getstream.io",
                });
            })
            .catch(error => {
                console.log(`getUserMedia error: ${error}`);
            });
    } catch (e) {
        console.log(e);
    }
}

document.getElementById('join').addEventListener('click', e => init(e));



