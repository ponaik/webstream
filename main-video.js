import 'video.js/dist/video-js.css';
import 'videojs-hls-quality-selector/dist/videojs-hls-quality-selector.css';
import videojs from 'video.js/dist/video.es.js';
import 'videojs-hls-quality-selector/dist/videojs-hls-quality-selector.min.js';
import 'videojs-hotkeys';


// console.log(hlsQualitySelector)
// videojs.registerPlugin('hlsQualitySelector', HlsQualitySelector);

let subtitleOffset = 0;

var player = videojs('my-video', {
    html5: {
        vhs: {
            enableLowInitialPlaylist: false,
            overrideNative: true
        }
    }
});

player.src({
  src: 'http://localhost:8000/spongebob/master.m3u8',
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

    player.hotkeys({
		volumeStep: 0.1,
		seekStep: 5,
		enableModifiersForNumbers: false,
        customKeys: {
            // Create custom hotkeys
            captionKey: {
                key: function (event) {
                    // C for captures 
                    return event.code === "KeyC";
                },
                handler: function (player, options, event) {
                    const tracks = player.textTracks();
                    console.log(tracks);

                    for (let i = 0; i < tracks.length; i++) {
                        const track = tracks[i];
                        if (track.kind === 'subtitles' || track.kind === 'captions') {
                            track.mode = (track.mode === 'showing') ? 'disabled' : 'showing';
                        }
                    }
                },
            },
            subDelayUp: {
                key: (e) => e.code === "KeyJ",
                handler: () => {
                    applySubtitleOffset(1);
                }
            },
            subDelayDown: {
                key: (e) => e.code === "KeyK",
                handler: () => {
                    applySubtitleOffset(-1);
                }
            },
            syncKey: {
                key: (e) => e.code === "KeyS",
                handler: () => {
                    console.log('the sync is supposed to happen now');
                }
            },
        },
	});

    let tracks = player.textTracks();
    console.log(tracks);
    
    // player.on('seeked', () => {
    //     setTimeout(() => applySubtitleOffset(), 1000);
    // });



    var myButton = player.controlBar.addChild('button', {}, 0);
    var myButtonDom = myButton.el();
    myButtonDom.innerHTML = '<span class="vjs-icon-spinner"></span>';
    myButton.controlText("My Cancel Button");
    myButtonDom.onclick = function () { alert('Cancel Button Clicked!')};
});


const applySubtitleOffset = (offset = 0) => {
    const textTracks = player.textTracks();
    for (let i = 0; i < textTracks.length; i++) {
        const track = textTracks[i];
        if (track.kind === 'subtitles') {
            track.mode = 'showing';
            for (let j = 0; j < track.cues.length; j++) {
                const cue = track.cues[j];
                cue.startTime += offset;
                cue.endTime += offset;
            }
        }
    }
    subtitleOffset += offset;
    console.log("Subtitles offset: ", subtitleOffset);
}

// player.play();t