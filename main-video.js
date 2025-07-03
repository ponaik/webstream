import 'video.js/dist/video-js.css';
import 'videojs-hls-quality-selector/dist/videojs-hls-quality-selector.css';
import videojs from 'video.js/dist/video.es.js';
import 'videojs-hls-quality-selector/dist/videojs-hls-quality-selector.min.js';


// console.log(hlsQualitySelector)
// videojs.registerPlugin('hlsQualitySelector', HlsQualitySelector);

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


player.ready(function () {
    const qualityLevels = player.qualityLevels();
    
    qualityLevels.on('addqualitylevel', function (event) {
        const level = event.qualityLevel;
        console.log('Added level:', level);
        // Example: You can disable a level like this:
        // level.enabled = false;
    });
    
    player.hlsQualitySelector({
      displayCurrentQuality: true
    });
});


// player.play();t