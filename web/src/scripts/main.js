import "../styles/style.css";
import player, { hotkeysConfig } from "./video-player.js";
import { io } from "socket.io-client";

let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");

if (!roomId) {
  window.location = "index.html";
}
let seekedTrigger = true;

console.log(`Running prod: ${import.meta.env.PROD}`);
if (!import.meta.env.PROD) {
  window.player = player;
  window.eventRegister = seekedTrigger;
}
const wsURL = import.meta.env.VITE_WEBSOCKET_BASE_URL;

const socket = io(wsURL, {
  auth: { roomId },
  path: "/ws",
  timeout: 3000,
  transports: ["websocket", "polling", "flashsocket"],
  // cors: {
  //     origin: wsURI,
  //     credentials: true
  // },
  // withCredentials: true
});

// socket.on("connection", () => console.log("Connected to websocket !!"));

// socket.on("connect_error", console.log);

console.log(getAvailableMadia());

socket.on("getPlayerEvent", handleEvent);
socket.on("room_users", (users) => {
  console.log("Users in the room:", users);
});
socket.on("newUserJoined", console.log);

console.log(player);

function emitEvent(type, payload = {}) {
  if (!seekedTrigger && type === "seeked") {
    seekedTrigger = true;
    console.log("Emit event aborted for: ", type);
    return;
  }

  payload.timestamp = Date.now();

  console.log("Sending event: ", type);
  socket.emit("playerEvent", type, payload, (present) => {
    // console.log("callback from server ??? A present: ", present);
  });
}

let lastEventMillis = Date.now();
const eventTimeoutPeriod = 100;

function handleEvent(type, payload) {
  const transportTime = Date.now() - payload.timestamp;
  console.log(`Received event: ${type} in ${transportTime} ms, `, payload);
  lastEventMillis = Date.now();
  if (type === "seeked") {
    seekedTrigger = false;
  }

  switch (type) {
    case "pause":
      player.pause();
      break;
    case "play":
      player.play();
      break;
    case "seeked":
      // const wasPlaying = !player.paused();

      // if (wasPlaying) {
      //   player.pause();
      // }

      player.currentTime(payload.time);

      // if (wasPlaying) {
      //   player.play();
      // }

      break;
    case "sanityCheck":
      const localTime = player.currentTime();
      const remoteTime = payload.currentTime + transportTime / 1000;
      const timeDiff = localTime - remoteTime;
      console.log(
        `${Math.abs(timeDiff) > 2 ? "!!!!!!!!!" : ""} TimeDiff: ${timeDiff}`
      );
      break;
    default:
      console.log("It's dicks isn't it. (it's: ", type, ")");
      break;
  }
}

function handleDataChannelOpen() {
  setInterval(() => {
    const payload = {
      currentTime: player.currentTime(),
    };
    emitEvent("sanityCheck", payload);
  }, 30 * 1000);
  console.log("Events channel open");
}

// player.on('play', () => emitEvent('play'));
// player.on('pause', () => emitEvent('pause'));
let userActions = {
  click: playbackToggleAndEmit,
  hotkeys: function (/** @type {KeyboardEvent}*/ event) {
    // `this` is the player in this context
    console.log(event.code);
  },
};
hotkeysConfig.customKeys.playbackToggleAndEmit = {
  key: (e) => e.code === "Space",
  handler: playbackToggleAndEmit,
};

player.options({ userActions });
player.hotkeys(hotkeysConfig);

player.on("seeked", () => {
  player.pause();
  emitEvent("seeked", { time: player.currentTime() });
});
// player.on("waiting", () => console.log("waiiiiiiiiiiiiiiiting"));
// player.on("playing", () => console.log("playiiiiiiiiiiiiiiiiiiiiiiiing"));
// player.on("seeking", () =>
//   console.log("seeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeking")
// );
// player.on('timeupdate', () => console.log('TIIIIIIIIIIIIIIIIIIIIIIIIIME update'))

function playbackToggleAndEmit() {
  if (player.paused()) {
    emitEvent("play");
    player.play();
  } else {
    emitEvent("pause");
    player.pause();
  }
}

function getAvailableMadia() {
  const URL = import.meta.env.VITE_MEDIA_BASE_URL;
  if (!URL) {
    console.log("No media url");
    return [];
  }

  fetch(URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      console.log(response);
      return response.json();
    })
    .then((data) => {
      console.log("Parsed JSON:", data);
      return data;
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
    });
}
