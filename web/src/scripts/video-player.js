import 'video.js/dist/video-js.css';
import videojs from 'video.js';
import 'videojs-hotkeys';
import 'videojs-youtube';


// console.log(hlsQualitySelector)
// videojs.registerPlugin('hlsQualitySelector', HlsQualitySelector);

const OFFSET_STEP = 0.5;
let subtitleOffset = 0;
const ModalDialog = videojs.getComponent('ModalDialog');
/** @type {ModalDialog} */
let modal;

export let player = initPlayer();

document.getElementById('loadYoutube').onclick = () => {
    reloadPlayer();
}

const sourceInput = document.getElementById('playerSrc');
const typeInput = document.getElementById('playerSrcType');
const selectButton = document.getElementById('playerSrcSelect');

const applyPlayerSrc = (source, type) => {
    try {
        console.log("Trying src: ", source);

        if (type === 'application/x-mpegURL') {
            console.log("Source is hls....");

            player.src({
                src: source + '/master.m3u8', 
                type: type
                //   withCredentials: true
            });
            
            player.addRemoteTextTrack({
                kind: 'subtitles',
                label: 'English',
                srclang: 'en',
                src: source + '/subs_en.vtt',
                default: true
            }, false);
        } else {
            player.src({
                src: source,
                type: type
            });
        }


        localStorage.setItem("playerSrc", source);
        localStorage.setItem("playerType", type);
    } catch (error) {
        console.log("Wrong player src or something: ", error);
    }
} 

const storedSrc = localStorage.getItem('playerSrc');
const storedType = localStorage.getItem('playerType');

if (storedSrc && storedType) {
    applyPlayerSrc(storedSrc, storedType);
}

// player.handleKeyDown()

selectButton.onclick = () => {
    /** @type {string} */
    let source = sourceInput.value;
    // if (!source.includes("http") && !source.includes("hls/")) {
    //     source = "hls/" + source;
    // }
    // source += source.endsWith('/') ? '' : '/';
    
    applyPlayerSrc(source, typeInput.value);
};





function initPlayer() {
    let newPlayer = videojs('my-video', {
        responsive: true,
        controls: true,
        muted: true,
        height: 720,
        width: 1280,
        // enableSmoothSeeking: true,
        // aspectRatio: "16:9",
        techOrder: ['youtube', 'html5'],
        sources: [{type: "video/youtube", src: "https://www.youtube.com/watch?v=zNFkzq1AUoY&pp=0gcJCa0JAYcqIYzv"}],
        html5: {
            vhs: {
                enableLowInitialPlaylist: false,
                overrideNative: true
            }
        }
    });
       
    newPlayer.ready(handlePlayerReady);

    return newPlayer;
}

function handlePlayerReady() {
    // player.hotkeys(hotkeysConfig);

    var myButton = player.controlBar.addChild('button', {}, 0);
    var myButtonDom = myButton.el();
    myButtonDom.innerHTML = '<span class="vjs-icon-spinner"></span>';
    myButton.controlText("My Cancel Button");
    myButtonDom.onclick = applySync;

    modal = new ModalDialog(player, {
        content: 'kek!',
        temporary: false,
        unclosable: false,
        pauseOnOpen: false 
    });
    modal.on('keydown', (e) => {
        if (e.code === "KeyT") {
            modal.close();
        }
    });
    player.addChild(modal);
}

function reloadPlayer() {
    if (!player) {
        return;
    }
    player.dispose();   

    let container = document.getElementById('video-container');
    container.innerHTML = '';

    let videoTag = document.createElement('video-js');
    videoTag.id = 'my-video';
    videoTag.className = 'video-js vjs-default-skin';
    
    container.appendChild(videoTag);

    player = initPlayer();
}

const hotkeysConfig = {
    playPauseKey: () => false,
    alwaysCaptureHotkeys: true,
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
        testKey: {
            key: (e) => e.code === "KeyT",
            handler: () => {
                modal.open();
            }
        }
    },
};

function setAlertContent(message) {
    modal.content(message)
}

function showAlert() {
    modal.open();
}

function applySync() {
    console.log("Sync is supposed to happen now !!");

    // const wasPlaying = !player.paused();
    // if (wasPlaying) {
    //     player.pause();
    // }
    player.trigger('seeked');

    // if (wasPlaying) {
    //     player.play();
    // }
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

export { hotkeysConfig };
export { applyPlayerSrc };
export { showAlert, setAlertContent };