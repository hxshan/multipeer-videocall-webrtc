const { Server } = require('socket.io');
const express = require('express');
const http = require('http');
const app = express();

app.use(express.static('./public'));
const server = http.createServer(app);
const io = new Server(server);

var rooms =[]


io.on('connection',(socket)=>{
    console.log("socket conneted",socket.id)
    socket.emit('connected',socket.id)

    socket.on('create-room',async(roomCode)=>{
        await socket.join(roomCode)
        rooms.push(roomCode);
        console.log(rooms)
    })
    socket.on('join-room',async(roomCode)=>{
        //console.log('room code '+roomCode)
        if(rooms.includes(roomCode)){
            await socket.join(roomCode)
            socket.broadcast.emit('user-joined',socket.id)
        }else{
            socket.emit('room-404',roomCode)
        }
    })

    socket.on('offer',(offer,id)=>{
        socket.to(id).emit('offer',offer,socket.id)
    })
    socket.on('answer',(answer,id)=>{
        //console.log(id)
        socket.to(id).emit('answer',answer,socket.id);
    })
    socket.on('candidate',async(candidate,id)=>{
        //console.log('candidate ' ,candidate, id)
        socket.to(id).emit('candidate',candidate,socket.id)
    })

})


server.listen(3000, () => console.log('Server running on port 3000'));