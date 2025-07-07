import './style.css';

import { initializeApp } from "firebase/app";
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  addDoc,
  updateDoc,
  onSnapshot
} from "firebase/firestore";
import player from "./main-video.js";
import firebaseConfig from './firebase-config.js';

console.log(player);

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

// Global State
const pc = new RTCPeerConnection(servers);
let localStream = null;
let remoteStream = null;
let eventsChannel = null;

// HTML elements
const webcamButton = document.getElementById('webcamButton');
const webcamVideo = document.getElementById('webcamVideo');
const callButton = document.getElementById('callButton');
const callInput = document.getElementById('callInput');
const answerButton = document.getElementById('answerButton');
const remoteVideo = document.getElementById('remoteVideo');
const hangupButton = document.getElementById('hangupButton');
const chatButton = document.getElementById('chatButton');
const sendButton = document.getElementById('send');

// 0. Setup my asshole

document.addEventListener('keydown', (event) => {
  console.log(`Key pressed: ${event.key}`);
});

// 1. Setup media sources

webcamButton.onclick = async () => {
  // localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localStream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      frameRate: { ideal: 30, max: 60 },
      width: { ideal: 1920 },
      height: { ideal: 1080 }
    },
    audio: true
  });
  // remoteStream = new MediaStream();

  // Push tracks from local stream to peer connection
  localStream.getTracks().forEach((track) => {
    pc.addTrack(track, localStream);
  });

  // // Pull tracks from remote stream, add to video stream
  // pc.ontrack = (event) => {
  //   event.streams[0].getTracks().forEach((track) => {
  //     remoteStream.addTrack(track);
  //   });
  // };

  webcamVideo.srcObject = localStream;
  // remoteVideo.srcObject = remoteStream;

  callButton.disabled = false;
  answerButton.disabled = false;
  webcamButton.disabled = true;
};

// Emitting an event
function emitEvent(type, payload) {
  if (eventsChannel) {
    if (Date.now() - lastEventMillis < eventTimeoutPeriod) {
      console.log("Emit event aborted for: ", type);
      return;
    }

    console.log("Sending event: ", type);
    eventsChannel.send(JSON.stringify({ type, payload }));
  }
}

let isUserSeeked = true;
let lastEventMillis = Date.now();
const eventTimeoutPeriod = 100;

function handleEvent(event) {
  let { type, payload } = JSON.parse(event.data);
  console.log("Received event: ", type, payload);
  lastEventMillis = Date.now();

  switch (type) {
    case 'pause':
      player.pause();
      break;
    case 'play':
      player.play();
      break;
    case 'seeked':
      // isUserSeeked = false;
      const wasPlaying = !player.paused();
      
      if (wasPlaying) {
        player.pause();
      }

      player.currentTime(payload['time']);

      if (wasPlaying) {
        player.play();
      }

      break;
    default:
      console.log("It's dicks isn't it. (it's: ", type, ")");
      break;
  }
}

player.on('play', () => emitEvent('play'));
player.on('pause', () => emitEvent('pause'));
// player.on('seeked', () => {
//   console.log("Seeked detected");
//   if (isUserSeeked) {
//     emitEvent('seeked', {'time': player.currentTime()});
//   }
//   isUserSeeked = true;
// });
player.on('seeked', () => emitEvent('seeked', {'time': player.currentTime()}));


// video.onplay = (e) => {
//   emitEvent('play');
// }

// video.onpause = (e) => {
//   emitEvent('pause');
// }



// event channel creation
chatButton.onclick = () => {
  eventsChannel = pc.createDataChannel('events', {
    ordered: false
  });

  eventsChannel.onopen = () => console.log('Events channel open');
  eventsChannel.onmessage = handleEvent;
}

sendButton.onclick = () => {
  emitEvent("dicks", {one: "two"});
}

remoteStream = new MediaStream();

// Pull tracks from remote stream, add to video stream
pc.ontrack = (event) => {
  event.streams[0].getTracks().forEach((track) => {
    remoteStream.addTrack(track);
  });
};

remoteVideo.srcObject = remoteStream;

// 2. Create an offer
callButton.onclick = async () => {
  // Reference Firestore collections for signaling
  
  // const callDoc = firestore.collection('calls').doc();
  // const offerCandidates = callDoc.collection('offerCandidates');
  // const answerCandidates = callDoc.collection('answerCandidates');
  
  const callDoc = doc(collection(firestore, "calls")); 
  const offerCandidates = collection(callDoc, "offerCandidates");
  const answerCandidates = collection(callDoc, "answerCandidates");

  callInput.value = callDoc.id;

  // Get ICE candidates for caller and save to Firestore
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await addDoc(offerCandidates, event.candidate.toJSON());
    }
  };

  // Create and store offer
  const offerDescription = await pc.createOffer();
  await pc.setLocalDescription(offerDescription);

  const offer = {
    sdp: offerDescription.sdp,
    type: offerDescription.type,
  };

  await setDoc(callDoc, { offer });

  // Listen for remote answer
  onSnapshot(callDoc, (snapshot) => {
    const data = snapshot.data();
    if (!pc.currentRemoteDescription && data?.answer) {
      const answerDescription = new RTCSessionDescription(data.answer);
      pc.setRemoteDescription(answerDescription);
    }
  });

  // When answered, add candidate to peer connection
  onSnapshot(answerCandidates, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const candidate = new RTCIceCandidate(change.doc.data());
        pc.addIceCandidate(candidate);

        console.log("Added new answer canditate");
      }
    })
  });


  
  
  hangupButton.disabled = false;
};

// 3. Answer the call with the unique ID
answerButton.onclick = async () => {
  const callId = callInput.value;

  // Get references to call and its subcollections
  const callDocRef = doc(firestore, "calls", callId);
  const answerCandidatesRef = collection(callDocRef, "answerCandidates");
  const offerCandidatesRef = collection(callDocRef, "offerCandidates");

  // Save ICE candidates from callee
  pc.onicecandidate = async (event) => {
    if (event.candidate) {
      await addDoc(answerCandidatesRef, event.candidate.toJSON());
    }
  };

  // Fetch call data
  const callSnapshot = await getDoc(callDocRef);
  const callData = callSnapshot.data();

  // Set remote offer description
  const offerDescription = callData.offer;
  await pc.setRemoteDescription(new RTCSessionDescription(offerDescription));

  // Create and set local answer
  const answerDescription = await pc.createAnswer();
  await pc.setLocalDescription(answerDescription);

  const answer = {
    type: answerDescription.type,
    sdp: answerDescription.sdp,
  };

  // Save answer back to Firestore
  await updateDoc(callDocRef, { answer });

  // Listen for ICE candidates from the caller
  onSnapshot(offerCandidatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        const data = change.doc.data();
        pc.addIceCandidate(new RTCIceCandidate(data));
      }
    });
  });

  
  // Event channel connect

  pc.ondatachannel = event => {
    eventsChannel = event.channel;
    eventsChannel.onopen    = () => console.log('Channel opened');
    eventsChannel.onmessage = handleEvent;
  };
};
