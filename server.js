const express = require("express");
const app = express();
const server = require("http").createServer(app);
const { v4: uuidv4 } = require("uuid");
const io = require("socket.io")(server);
const PORT = process.env.PORT || 3030;


// Peer express connection without stunning

// const { ExpressPeerServer } = require("peer");
// const peerServer = ExpressPeerServer(server, {
//   debug: true,
// });
//app.use("/peerjs", peerServer);


app.set("view engine", "ejs");
app.use(express.static("public"));

//home page 
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

//random meet id for room
app.get("/new", (req, rsp) => {
  rsp.redirect(`/${uuidv4()}`);
});

// join that room
app.get("/:room", (req, res) => {
  res.render("room", { roomId: req.params.room });
});

io.on('connection', socket =>{
  console.log('connected..');
})

io.on("connection", (socket) => {
  socket.on("join-room", (roomId, userId,UserName) => {
    // user joined room
    socket.join(roomId);
    // broadcast to everyone that user joined 
    io.to(roomId).emit("user-connected", userId);  
     // message to everyone 
    socket.on("message", (message) => {
      io.to(roomId).emit("createMessage", message,UserName);
    });
    //Then user disconnect, let everyone know
    socket.on('disconnect',()=>{
      io.to(roomId).emit('user-disconnected',userId)
      socket.leave(roomId);
      console.log('server leaved');
      });
  });
});

server.listen(PORT,()=>{
  console.log('server is running at port 3030');
});