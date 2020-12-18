let config = require("./config.json");

var app = require('express')();
var bodyParser = require('body-parser')

var http = require('http').createServer(app);
var io = require('socket.io')(http, {
    cors: {
        origin: "http://smartrent.vagrant",
        methods: ["GET", "POST"]
    }
});

// --------------------------- WSS SERVER ---------------------------

const userToSocketsMap = new Map();
const socketIdToUserIdMap = new Map();

io.on('connection', (socket) => {
    let userData = {};
    userData.id = socket.handshake.query.employee_id ;
    userData.user = socket.handshake.query.employee_user ;
    userData.full_name = socket.handshake.query.employee_full_name ;

    addClientToMap(userData, socket);
    console.log("CONNECTED: ".padEnd(15, " ") + userData.user);

    socket.userData = userData;

    socket.on('join-room', function (room) {
        socket.join(room);
        console.log("ROOM JOINED: ".padEnd(15, " ") + userData.user + ' -> ' + room);
    });

    socket.on('disconnect', function() {
        console.log("DISCONNECTED: ".padEnd(15, " ") + userData.user + ", " + socket.id);
        removeClientFromMap(socket.userData, socket);
    });
});

function addClientToMap(userData, socket){
    if (!userToSocketsMap.has(userData.id)) {
        let userToSocket = {
            "userData" : userData,
            "sockets" : new Map()
        };
        userToSocket.sockets.set(socket.id,socket);
        userToSocketsMap.set(userData.id, userToSocket);
    } else{
        userToSocketsMap.get(userData.id).sockets.set(socket.id, socket);
    }
}

function removeClientFromMap(userData, socket){
    if (userToSocketsMap.has(userData.id)) {
        let socketsSet = userToSocketsMap.get(userData.id).sockets;
        socketsSet.delete(socket.id);
        if (socketsSet.size === 0 ) {
            userToSocketsMap.delete(userData.id);
        }
    }
}

// --------------------------- HTTP SERVER ---------------------------

var jsonParser = bodyParser.json()

app.post('/test', jsonParser, (req, res) => {
    io.emit('chat message', req.data);
    res.json({"result" : true})
});

app.post('/debug', jsonParser, (req, res) => {
    let debugData = getDebugData();
    res.json({"result" : debugData})
});

app.post('/event', jsonParser, (req, res) => {
    let postData = req.body
    if(postData.token !== config.token) {
        let message = {"result" : "false", "message" : "Invalid authentication token"};
        console.log(message);
        res.json(message)
    }
    console.log(postData);
    res.json({"result" : true})
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});


function getRoomsForUser(userSockets) {

    let rooms = new Set();

    userSockets.forEach(function(socket, socketId) {
        socket.rooms.forEach(function (roomName, index) {
            if(roomName === socket.id) {
                return true;
            }
            rooms.add(roomName);
        });
    });
    return Array.from(rooms);
}

function getDebugData() {
    let debugData = {
        users : {}

    };
    userToSocketsMap.forEach(function(value, key) {
        debugData.users[key] = {
            userData : value.userData,
            rooms : getRoomsForUser(value.sockets),
            socketCount : value.sockets.size
        };
    });

    let rooms = {};

    for (const [userId, userData] of Object.entries(debugData.users)) {
        userData.rooms.forEach(function (roomName) {
            if (!rooms[roomName]) {
                rooms[roomName] = new Set([userId])
            } else {
                rooms[roomName].add(userId);
            }
        });
    }


    for (const [roomName, userIds] of Object.entries(rooms)) {
        rooms[roomName] = Array.from(userIds);
    }

    debugData.rooms = rooms;
    debugData.totalSockets = io.sockets.sockets.size;

    return debugData;
}

setInterval(function () {
    let debugData = getDebugData();
    io.to("debug-room").emit("debug-data-sent", debugData);
}, 2000);

