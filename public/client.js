const socket = io();
var roomCode = "";
var userId;
var localStream;
const createRoomBtn = document.getElementById("createRoom");
const roomCodeInp = document.getElementById("roomInput");
const joinRoomBtn = document.getElementById("joinRoom");
const userIdText = document.getElementById("userId");

const micBtn = document.getElementById("mic");
const cameraBtn = document.getElementById("camera");
const disconnectBtn = document.getElementById("disconnect");

const iceConfiguration = {
  iceServers: [
    {
      urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"],
    },
  ],
};

var peerConnections = {};

var remoteStreams = {};

const getLocalMedia = async () => {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true ,/*audio:true */});
  document.getElementById("local").srcObject = localStream;
};

socket.on("connected", (id) => {
  console.log("connected");
  userId = id;
  userIdText.textContent = "User ID: " + userId;
});

socket.on("user-joined", async (userId) => {
  console.log("joined  ", userId);
  let peerConnection = new RTCPeerConnection(iceConfiguration);

  peerConnections[userId] = peerConnection;

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  remoteStreams[userId] = new MediaStream();

  let remoteStream = document.createElement("video");
  remoteStream.classList.add("video");
  remoteStream.classList.add("remote");
  remoteStream.dataset.peerId = userId;
  remoteStream.id = `remote-${userId}`;
  remoteStream.autoplay = true;
  document.getElementById("streams").appendChild(remoteStream);

  peerConnection.ontrack = async (event) => {
    event.streams[0].getTracks().forEach((track) => {
      remoteStreams[userId].addTrack(track);
    });
    document.getElementById(`remote-${userId}`).srcObject =
      remoteStreams[userId];
  };


  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate, userId);
    }
  };

  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, userId);
});

socket.on("offer", async (offer, userId) => {
  console.log("offer ", offer + "from", userId);
  let peerConnection = new RTCPeerConnection(iceConfiguration);

  peerConnections[userId] = peerConnection;

  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  remoteStreams[userId] = new MediaStream();

  let remoteStream = document.createElement("video");
  remoteStream.classList.add("video");
  remoteStream.classList.add("remote");
  remoteStream.dataset.peerId = userId;
  remoteStream.id = `remote-${userId}`;
  remoteStream.autoplay = true;
  document.getElementById("streams").appendChild(remoteStream);

  peerConnection.ontrack = async (event) => {
    console.log("tracks");
    event.streams[0].getTracks().forEach((track) => {
      remoteStreams[userId].addTrack(track);
    });
    document.getElementById(`remote-${userId}`).srcObject =
      remoteStreams[userId];
  };


  await peerConnection.setRemoteDescription(offer);

  peerConnection.onicecandidate = async (event) => {
    if (event.candidate) {
      socket.emit("candidate", event.candidate, userId);
    }
  };

  const answer = await peerConnections[userId].createAnswer();
  await peerConnections[userId].setLocalDescription(answer);
  socket.emit("answer", answer, userId);
});

socket.on("answer", async (answer, id) => {
  console.log("answer ", answer);
  await peerConnections[id].setRemoteDescription(
    new RTCSessionDescription(answer)
  );
});
socket.on("candidate", async (candidate, userId) => {
  // console.log(peerConnections)
  // console.log(userId)
  peerConnections[userId].addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("user-disconneted", async (userId) => {
  // peerConnections[userId].close()
  remoteStreams[userId].getTracks().forEach((track) => {
    track.stop();
  });
  document.getElementById(`remote-${userId}`).remove();
});

createRoomBtn.addEventListener("click", async () => {
  roomCodeInp.value === ""
    ? (roomCode = Math.random().toString(36).slice(2, 7))
    : (roomCode = roomCodeInp.value);
  await getLocalMedia();
  socket.emit("create-room", roomCode);
});

joinRoomBtn.addEventListener("click", async () => {
  let roomExist = true;
  if (roomCodeInp.value === "") {
    alert("Room code cannot be empty");
  } else {
    roomCode = roomCodeInp.value;
    socket.emit("join-room", roomCode);
  }
  socket.on("room-404", () => {
    alert("room not found");
    roomExist = false;
  });
  if (roomExist) {
    await getLocalMedia();
  }
});
disconnectBtn.addEventListener("click", () => {
  peerConnections = {};
  remoteStreams = {};
  let remotes = document.querySelectorAll(".remote");
  console.log(remotes);
  remotes.forEach((remote) => {
    remote.remove();
  });
  socket.emit("disconnected", roomCode, userId);
  roomCode = "";
});
cameraBtn.addEventListener("click", () => {
  localStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
});
micBtn.addEventListener("click", () => {
  localStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
});
