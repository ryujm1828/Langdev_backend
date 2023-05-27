const express = require("express");
const app = express();
const httpserver = require('http').createServer(app); 
const io = require("socket.io")(httpserver, {
  /*
  cors: {
    origin: "http://localhost:5001",
    methods: ["GET","POST"],
  },
  */
})

module.exports = ()=>{
    io.on('connection', (socket)=>{
        console.log(`User Connection: ${socket.id}`)
        socket.on("send_message", (data)=>{
            console.log(data);
        })
      })
      
    httpserver.listen(5001);
}



/*

const startx = 1024/2;
const starty = 768/2;

class Player{
    constructor(socket){
        this.socket = socket;
        this.x = startx;
        this.y = starty;
        this.color = '#555555';
    }
    get id(){
        return this.socket.id;
    }
}

let playerList = [];
let playerMap = [];

function joinGame(socket){
    let player = new Player(socket);
    playerList.push(player);
    playerMap[socket.id] = player;

    return player;
}

function endGame(socket){
    for(let i = 0; i < playerList.length; i++){
        if(playerList[i].id == socket.id){
            playerList.splice(i,1);
            break;
        }
    }
    delete playerMap[socket.id];
}
*/