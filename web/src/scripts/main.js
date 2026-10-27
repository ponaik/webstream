import "../styles/style.css";
import { emitEvent, enableSanityCheck, handleEvent, playbackToggleAndEmit } from "./event-logic.js";
import { hotkeysConfig, player } from "./video-player.js";
import { io } from "socket.io-client";

console.log(`Running prod: ${import.meta.env.PROD}`);
export const SANITY_CHECK_PERIOD = 10 * 1000;
export const TIME_DIFF_THRESHOLD = 3;

const wsURL = import.meta.env.VITE_WEBSOCKET_BASE_URL;
const URL = import.meta.env.VITE_MEDIA_BASE_URL;
let queryString = window.location.search;
let urlParams = new URLSearchParams(queryString);
let roomId = urlParams.get("room");

if (!roomId) {
  window.location = "index.html";
}

export const socket = io(wsURL, {
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


// ?????
// if (!import.meta.env.PROD) {
//   window.player = player;
//   window.eventRegister = seekedTrigger;
// }

// init appropriate dev/prod source url placeholder
const sourceInput = document.getElementById('playerSrc');
sourceInput.setAttribute("value", URL);



// socket.io event bullshit
socket.on("getPlayerEvent", handleEvent);
socket.on("room_users", (users) => {
  console.log("Users in the room:", users);
});
socket.on("newUserJoined", console.log);
socket.on("user_exit", console.log);

enableSanityCheck(SANITY_CHECK_PERIOD);


// player event emit bullshit
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