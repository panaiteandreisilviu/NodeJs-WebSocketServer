let config = require("./config.json");

var app = require('express')();
var bodyParser = require('body-parser')

var http = require('http').createServer(app);
var io = require('socket.io')(http, {
    cors: {
        origin: true,
        methods: ["GET", "POST"]
    }
});

// --------------------------- WSS SERVER ---------------------------

const userToSocketsMap = new Map();

io.on('connection', (socket) => {
    let userData = {};
    userData.id = socket.handshake.query.employee_id ;
    userData.user = socket.handshake.query.employee_user ;
    userData.full_name = socket.handshake.query.employee_full_name ;

    addClientToMap(userData, socket);
    logMsg("CONNECTED: ".padEnd(15, " ") + userData.user);

    socket.userData = userData;

    socket.on('join-room', function (room) {
        socket.join(room);
        logMsg("ROOM JOINED: ".padEnd(15, " ") + userData.user + ' -> ' + room);
    });

    socket.on('disconnect', function() {
        logMsg("DISCONNECTED: ".padEnd(15, " ") + userData.user + ", " + socket.id);
        removeClientFromMap(socket.userData, socket);
    });
});

function addClientToMap(userData, socket) {
    if (!userToSocketsMap.has(userData.id)) {
        let userToSocket = {
            "userData" : userData,
            "sockets" : new Map()
        };
        userToSocket.sockets.set(socket.id,socket);
        userToSocketsMap.set(userData.id, userToSocket);
    } else {
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

app.post('/test-logging', jsonParser, (req, res) => {
    let counter = 0;
    let start = new Date();
    let interval = setInterval(function () {
        counter++;
        logMsg("TESTING LOGS - " + counter + "/2000");
        if (counter == 2000) {
            let stop = new Date();
            let duration = stop.getTime() - start.getTime();
            //logMsg("DURATION: " + (duration / 1000).toFixed(2) + "s");
            clearInterval(interval);
        }
    }, 1);

    res.json({"result" : true});
});

app.post('/event', jsonParser, (req, res) => {
    let requestBody = req.body
    if(requestBody.token !== config.token) {
        let message = {"result" : "false", "message" : "Invalid authentication token"};
        res.json(message)
    }

    let rooms = requestBody.rooms ? requestBody.rooms : [];
    let users = requestBody.users ? requestBody.users : [];
    let event = requestBody.event;
    let eventData = requestBody.data;

    logMsg("SR EVENT: ".padEnd(15, " ") + event + " users: " + JSON.stringify(users) + " rooms: " + rooms + " data: " + JSON.stringify(eventData));

    if(rooms.constructor === Array && rooms.length) {
        rooms.map(function(room) {
            io.to(room).emit(event, eventData)
        });
    } else if(users.constructor === Array && users.length) {
        users.forEach(function(userId) {
            userId = userId.toString();
            logMsg(userId);
            if(userToSocketsMap.has(userId)) {
                logMsg(userId);
                let userSockets = userToSocketsMap.get(userId).sockets;
                logMsg("sockets:" + userToSocketsMap.get(userId).sockets.size);

                userSockets.forEach(function (socket) {
                    logMsg(event + " " + JSON.stringify(eventData) + " " + socket.id);
                    socket.emit(event, eventData);
                });
            }
        });
    } else {
        let message = {"result" : "false", "message" : ""};
        res.json(message)
    }
    res.json({"result" : true})
});

let cliArgsPort = process.argv.slice(3);
let port = parseInt(cliArgsPort) ? parseInt(cliArgsPort) : 3000;

http.listen(port, () => {
    console.log('listening on *:' + port);
    logMsg('SERVER LISTENING ON *:' + port);
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

function logMsg(message) {
    io.to("debug-room").emit("log-sent", message);
}

setInterval(function () {
    let debugData = getDebugData();
    io.to("debug-room").emit("debug-data-sent", debugData);
}, 2000);

