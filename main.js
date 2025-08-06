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

socket.on("getPlayerEvent", handleEvent);

console.log(player);
console.log(`Running dev: ${import.meta.env.DEV}`);


// Emitting an event
function emitEvent(type, payload={}) {
  if (Date.now() - lastEventMillis < eventTimeoutPeriod) {
      console.log("Emit event aborted for: ", type);
      return;
    }

    payload.timestamp = Date.now();

    console.log("Sending event: ", type);
    socket.emit("playerEvent", type, payload, (present) => {
      console.log("callback from server ??? A present: ", present);
    });
}

let lastEventMillis = Date.now();
const eventTimeoutPeriod = 100;

function handleEvent(type, payload) {
  const transportTime = Date.now() - payload.timestamp;
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
      // const wasPlaying = !player.paused();
      
      // if (wasPlaying) {
      //   player.pause();
      // }

      player.currentTime(payload.time);

      // if (wasPlaying) {
      //   player.play();
      // }

      break;
    case 'sanityCheck':
      const localTime = player.currentTime();
      const remoteTime = payload.currentTime + transportTime/1000;
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
