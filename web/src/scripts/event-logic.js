import { socket, TIME_DIFF_THRESHOLD } from "./main";
import { showAlert, player, setAlertContent } from "./video-player";

let seekedTrigger = true; 

export function emitEvent(type, payload = {}) {
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

export function handleEvent(type, payload) {
  const transportTime = Date.now() - payload.timestamp;
  console.log(`Received event: ${type} in ${transportTime} ms, `, payload);
  // lastEventMillis = Date.now();
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

      console.log(`TimeDiff: ${timeDiff}`);
      setAlertContent(`TimeDiff: ${timeDiff}`);
      if (Math.abs(timeDiff) > TIME_DIFF_THRESHOLD) {
        setAlertContent("JOPAAAA !!!!!!!! " + timeDiff);
        showAlert();
      }
      break;
    default:
      console.log("It's dicks isn't it. (it's: ", type, ")");
      break;
  }
}

export function enableSanityCheck(period) {
  setInterval(() => {
    const payload = {
      currentTime: player.currentTime(),
    };
    emitEvent("sanityCheck", payload);
  }, period);
  console.log("Sanity checks ready");
}

export function playbackToggleAndEmit() {
  if (player.paused()) {
    emitEvent("play");
    player.play();
  } else {
    emitEvent("pause");
    player.pause();
  }
}