import 'video.js/dist/video-js.css';
import videojs from 'video.js';
import 'videojs-hotkeys';


// console.log(hlsQualitySelector)
// videojs.registerPlugin('hlsQualitySelector', HlsQualitySelector);

const OFFSET_STEP = 0.5;
let subtitleOffset = 0;

var player = videojs('my-video', {
    html5: {
        vhs: {
            enableLowInitialPlaylist: false,
            overrideNative: true
        }
    }
});

// player.handleKeyDown()

player.src({
  src: 'http://localhost:8000/spongebob/master.m3u8',
//   src: './hls/spongebob/master.m3u8',
  type: 'application/x-mpegURL'
//   withCredentials: true
});


player.ready(function () {
    player.addRemoteTextTrack({
        kind: 'subtitles',
        label: 'English',
        srclang: 'en',
        // src: './hls/spongebob/subs_en.vtt',
        src: 'http://localhost:8000/spongebob/subs_en.vtt',
        default: true
    }, false);

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
                    applySubtitleOffset(OFFSET_STEP);
                }
            },
            subDelayDown: {
                key: (e) => e.code === "KeyK",
                handler: () => {
                    applySubtitleOffset(-OFFSET_STEP);
                }
            },
            syncKey: {
                key: (e) => e.code === "KeyS",
                handler: applySync
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
    myButtonDom.onclick = applySync;
});

const applySync = () => {
    console.log("Sync is supposed to happen now !!");
    
    const wasPlaying = !player.paused();
      
    if (wasPlaying) {
        player.pause();
    }

    player.trigger('seeked');

    if (wasPlaying) {
        player.play();
    }
}

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

export default player;