import 'video.js/dist/video-js.css';
import videojs from "video.js";


var player = videojs('my-video', {
    html5: {
        vhs: {
            overrideNative: true
        }
    }
});

player.src({
  src: 'http://localhost:8000/master.m3u8',
  type: 'application/x-mpegURL'
//   withCredentials: true
});

// player.play();