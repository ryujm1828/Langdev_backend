const io = require('socket.io')(server);

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



io.on('connection', (socket)=>{
    socket.on('login', (data)=>{
        if(!data.userId){
            socket.emit('Please Login');
        }
        else{
            console.log(`${data.userId} connect`);
        }
    })

    socket.on('disconnect', function(reason){
        console.log(`${socket.id}님이 ${reason}의 이유로 퇴장하였습니다.`)
    })

    let newPlayer = joinGame(socket);
    socket.emit('user_id',socket.id);

    for(let i = 0; i < playerList.length; i++){
        let player = playerList[i];
        socket.emit('join_user',{
            id: player.id,
            x : player.x,
            y : player.y,
            color : player.color
        });
    }

    socket.broadcast.emit('join_user',{
        id: socket.id,
        x : newPlayer.x,
        y: newPlayer.y,
        color : newPlayer.color
    })


    socket.on('key_press',(data)=>{
        if(data.key == 'w'){
            socket.broadcast.emit('update_state',{
                id: data.id,
                x: data.x,
                y: data.y + 10
            })
        }
        
    })
})