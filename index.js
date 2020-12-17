var app = require('express')();
var bodyParser = require('body-parser')

// var cors = require('cors')
// app.use(cors())

var http = require('http').createServer(app);
var io = require('socket.io')(http, {
    cors: {
        origin: "http://smartrent.vagrant",
        methods: ["GET", "POST"]
    }
});

// --------------------------- WSS SERVER ---------------------------

const userSocketIdMap = new Map(); // a map of online userIds and their clients

io.on('connection', (socket) => {
    let userId = socket.handshake.query.userId ;
    addClientToMap(userId, socket.id);
    console.log("CONN" + " " + userId);
});

io.on('disconnect', (socket) => {
    let userId = socket.handshake.query.userId ;
    removeClientFromMap(userId, socket.id);
});

function addClientToMap(userId, socketId){
    if (!userSocketIdMap.has(userId)) {
        userSocketIdMap.set(userId, new Set([socketId]));
    } else{
        userSocketIdMap.get(userId).add(socketId);
    }
}
function removeClientFromMap(userId, socketId){
    if (userSocketIdMap.has(userId)) {
        let userSocketIdSet = userSocketIdMap.get(userId);
        userSocketIdSet.delete(socketId);
        if (userSocketIdSet.size === 0 ) {
            userSocketIdMap.delete(userId);
        }
    }
}

// --------------------------- HTTP SERVER ---------------------------

var jsonParser = bodyParser.json()

app.post('/test', jsonParser, (req, res) => {
    io.emit('chat message', req.data);
    res.json({"result" : true})
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

