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
            socket.to(roomCode).emit('user-joined',socket.id)
            await socket.join(roomCode)
        }else{
            socket.to(roomCode).emit('room-404',roomCode)
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

    socket.on('disconnected',async(roomCode,userId)=>{
        socket.leave(roomCode)
        socket.to(roomCode).emit('user-disconneted',userId)
    })


})


server.listen(3000, () => console.log('Server running on port 3000'));