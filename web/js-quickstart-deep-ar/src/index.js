import {
  HMSReactiveStore,
  selectIsLocalAudioEnabled,
  selectIsLocalVideoEnabled,
  selectPeers,
  selectIsConnectedToRoom,
  selectIsLocalVideoPluginPresent
} from "@100mslive/hms-video-store";
import { plugin } from './deep-ar-plugin';
import './styles.css'

// Initialize HMS Store
const hmsManager = new HMSReactiveStore();
hmsManager.triggerOnSubscribe();
const hmsStore = hmsManager.getStore();
const hmsActions = hmsManager.getActions();

// HTML elements
const form = document.getElementById("join");
const joinBtn = document.getElementById("join-btn");
const conference = document.getElementById("conference");
const peersContainer = document.getElementById("peers-container");
const leaveBtn = document.getElementById("leave-btn");
const muteAudio = document.getElementById("mute-aud");
const muteVideo = document.getElementById("mute-vid");
const controls = document.getElementById("controls");
const toggleDeepAR = document.getElementById("toggle-deep-ar");

// Joining the room
joinBtn.onclick = () => {
  hmsActions.join({
    userName: document.getElementById("name").value,
    authToken: document.getElementById("token").value
  });
};

toggleDeepAR.onclick = async () => {
  const isPluginEnabled = hmsStore.getState(selectIsLocalVideoPluginPresent(plugin.getName()));
  if(isPluginEnabled) {
    await hmsActions.removePluginFromVideoTrack(plugin);
  } else {
    try {
      await hmsActions.addPluginToVideoTrack(plugin);
      renderPeers();
    } catch(error) {
      console.error(error);
    }
  }
}

// Leaving the room
function leaveRoom() {
  hmsActions.leave();
}

// Cleanup if user refreshes the tab or navigates away
window.onunload = window.onbeforeunload = leaveRoom;
leaveBtn.onclick = leaveRoom;

// Helper function to create html elements
function createElementWithClass(tag, className) {
  const newElement = document.createElement(tag);
  newElement.className = className;
  return newElement;
}

// Render a single peer
function renderPeer(peer) {
  const peerTileDiv = createElementWithClass("div", "peer-tile");
  const videoElement = createElementWithClass("video", "peer-video");
  const peerTileName = createElementWithClass("span", "peer-name");
  videoElement.autoplay = true;
  videoElement.muted = true;
  videoElement.playsinline = true;
  peerTileName.textContent = peer.name;
  hmsActions.attachVideo(peer.videoTrack, videoElement);
  peerTileDiv.append(videoElement);
  peerTileDiv.append(peerTileName);
  return peerTileDiv;
}

// display a tile for each peer in the peer list
function renderPeers() {
  peersContainer.innerHTML = "";
  const peers = hmsStore.getState(selectPeers);

  peers.forEach((peer) => {
    if (peer.videoTrack) {
      peersContainer.append(renderPeer(peer));
    }
  }); 
}

// Reactive state - renderPeers is called whenever there is a change in the peer-list
hmsStore.subscribe(renderPeers, selectPeers);

// Mute and unmute audio
muteAudio.onclick = () => {
  const audioEnabled = !hmsStore.getState(selectIsLocalAudioEnabled);
  hmsActions.setLocalAudioEnabled(audioEnabled);
  muteAudio.textContent = audioEnabled ? "Mute" : "Unmute";
};

// Mute and unmute video
muteVideo.onclick = () => {
  const videoEnabled = !hmsStore.getState(selectIsLocalVideoEnabled);
  hmsActions.setLocalVideoEnabled(videoEnabled);
  muteVideo.textContent = videoEnabled ? "Hide" : "Unhide";
  // Re-render video tile
  renderPeers();
};

// Showing the required elements on connection/disconnection
function onConnection(isConnected) {
  if (isConnected) {
    form.classList.add("hide");
    conference.classList.remove("hide");
    leaveBtn.classList.remove("hide");
    controls.classList.remove("hide");
  } else {
    form.classList.remove("hide");
    conference.classList.add("hide");
    leaveBtn.classList.add("hide");
    controls.classList.add("hide");
  }
}

// Listen to the connection state
hmsStore.subscribe(onConnection, selectIsConnectedToRoom);
  