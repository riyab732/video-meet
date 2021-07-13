const socket = io("/");
const chatInputBox = document.getElementById("chat_message");
const all_messages = document.getElementById("all_messages");
const main__chat__window = document.getElementById("main__chat__window");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const closeChat = document.querySelector("#closeChat");
myVideo.muted = true;   // Mute 


const user=prompt("Enter your name");
const peerstreams={};
let connectedpeers = {}
var currentPeer;

//new peer 
const peer = new Peer(undefined, {
  // path: "/peerjs",
  // host: "/",
  // port: "3030",
  
  config: {
  "iceServers": [
    {"urls": "stun:stun.l.google.com:19302"},
],
"iceServersFromUrl": ""
  },
  debug:2,
});

var getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia;

  let myVideoStream;
// Access the user's video and audio
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {

   myVideoStream =stream;
   // Display my video stream
   addVideoStream(myVideo, stream);

   //join someone's room, will receive a call from them
    peer.on("call", (call) => {
      call.answer(stream);         // Stream them my video/audio
      const video = document.createElement("video");

   //create new video grid and receive their stream and display in grid

    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream);
      peerstreams[call.peer] = userVideoStream;
      currentPeer= call.peerConnection;
      });
     connectedpeers[call.peer] = call
     call.on("close", () => {
        video.remove();
      })
    });

    //connect to new user
    socket.on("user-connected", (userId) => {
      connectToNewUser(userId, stream);
      console.log('user connected');
    });
    //keyboard event listner
    document.addEventListener("keydown", (e) => {
      if (e.which === 13 && chatInputBox.value != "") {
        socket.emit("message", chatInputBox.value,user);
        chatInputBox.value = "";
      }
    });

    //send message event
    socket.on("createMessage", (msg,UserName) => {
      console.log(msg);
      let nameele = document.createElement('div')
      let messagele = document.createElement('div')
       let chatele = document.createElement('div')
      let d = new Date()
      let curhour = d.getHours()
      let curmin = d.getMinutes()
      nameele.innerHTML = `${UserName === user ? "You:\n" : UserName+":\n"} <span>  ${curhour}:${curmin} </span>`
      messagele.innerHTML = msg
      nameele.classList.add('sender_name')
      messagele.classList.add('sender_message')
      chatele.append(nameele)
      chatele.append(messagele)
      all_messages.append(chatele)
      main__chat__window.scrollTop = main__chat__window.scrollHeight;
    });
  });


// When open the app, join a room
peer.on("open", async id => {
  console.log("user id "+ id);
  socket.emit("join-room", ROOM_ID, id,user);
});

// user dissconnection
socket.on('user-disconnected',(userId)=>{
  if (connectedpeers[userId]) {
    connectedpeers[userId].close();
    delete connectedpeers.userId
  }
});

const connectToNewUser= (userId, streams)=>{

  const call = peer.call(userId, streams);
  const video = document.createElement("video");
  call.on("stream", (userVideoStream) => {
    addVideoStream(video, userVideoStream)
    peerstreams[userId] = userVideoStream
    currentPeer= call.peerConnection;
  })

  // If they leave, remove their video
  call.on('close', () => {
    video.remove();
    console.log("user is disconnnect");
})
connectedpeers[userId] = call
};



const addVideoStream= (videoEl, stream)=>{
  videoEl.srcObject = stream;
  // Play the video as it loads
  videoEl.addEventListener("loadedmetadata", () => {
    videoEl.play();
  })
  // Append video element to videoGrid
  videoGrid.append(videoEl);

  let totalUsers = document.getElementsByTagName("video").length;
  if (totalUsers > 1) {
    for (let index = 0; index < totalUsers; index++) {
      document.getElementsByTagName("video")[index].style.width =
        100 / totalUsers + "%";
    }
  }
};

// share screen

function shareScreen() {
	
  navigator.mediaDevices.getDisplayMedia({
    video: {
      cursor:"always",
    },
    audio: {
      echoCancellation:true,
      noiseSuppression:true
    }
  }).then(stream => {
    let videoTrack=stream.getVideoTracks()[0];
     videoTrack.onended = function()
     {
       stopScreenShare();
     }
     let sender= currentPeer.getSenders().find(function(s){
       return s.track.kind == videoTrack.kind
     })
     sender.replaceTrack(videoTrack);
  });
}
function stopScreenShare()
{
  let videoTrack = myVideoStream.getVideoTracks()[0];
  var sender = currentPeer.getSenders().find(function(s)
  {
    return s.track.kind == videoTrack.kind;
  })
  sender.replaceTrack(videoTrack)
}


// video stop\play
const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;

  }
};


// audio mute\unmute
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const setPlayVideo = () => {
  const html = `<i class="unmute fa fa-pause-circle"></i>
  <span class="unmute">Resume Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setStopVideo = () => {
  const html = `<i class=" fa fa-video-camera"></i>
  <span class="">Pause Video</span>`;
  document.getElementById("playPauseVideo").innerHTML = html;
};

const setUnmuteButton = () => {
  const html = `<i class="unmute fa fa-microphone-slash"></i>
  <span class="unmute">Unmute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};
const setMuteButton = () => {
  const html = `<i class="fa fa-microphone"></i>
  <span>Mute</span>`;
  document.getElementById("muteButton").innerHTML = html;
};



// display chat
showChat.addEventListener("click", () => {
  document.querySelector(".main_right").style.display = "flex";
  document.querySelector(".main_right").style.flex = "0.2";
  document.querySelector(".main__left").style.flex = "0.8";
});

// close chat
closeChat.addEventListener("click", () => {
  document.querySelector(".main_right").style.display = "none";
  //document.querySelector(".main_right").style.flex = "0.2";
  document.querySelector(".main__left").style.flex = "1";

});

// invite popup
const copyToClip = ()=>{
  var copyText = document.getElementById("roomLink");
  copyText.select();
  document.execCommand("copy");
  alert("Meet code copied:  "+ copyText.value);
  document.getElementById("myModal").style.display = "none";
}

var modal = document.getElementById("myModal");
var btn = document.getElementById("invitepeople");

btn.onclick = function() {
  document.getElementById('roomLink').value = ROOM_ID;
  modal.style.display = "block";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}