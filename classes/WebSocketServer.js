
class WebSocketServer {

    // private fields
    #io;
    #userToSocketsMap;

    // ----------------------------------------------

    constructor(http) {

        this.userToSocketsMap = new Map();

        this.io = require('socket.io')(http, {
            cors: {
                origin: true,
                methods: ["GET", "POST"]
            }
        });

        this.initEvents();
    }

    // ----------------------------------------------

    get ioObj() {
        return this.io;
    }

    // ----------------------------------------------

    initEvents() {
        let instance = this;

        this.io.on('connection', (socket) => {
            let userData = {};
            userData.id = socket.handshake.query.employee_id ;
            userData.user = socket.handshake.query.employee_user ;
            userData.full_name = socket.handshake.query.employee_full_name ;

            this.addClientToMap(userData, socket);
            this.logMsg("CONNECTED: ".padEnd(15, " ") + userData.user);

            socket.userData = userData;

            socket.on('join-room', function (room) {
                socket.join(room);
                instance.logMsg("ROOM JOINED: ".padEnd(15, " ") + userData.user + ' -> ' + room);
            });

            socket.on('disconnect', function() {
                instance.logMsg("DISCONNECTED: ".padEnd(15, " ") + userData.user + ", " + socket.id);
                instance.removeClientFromMap(socket.userData, socket);
            });
        });

        setInterval(function () {
            let debugData = instance.getDebugData();
            instance.io.to("debug-room").emit("debug-data-sent", debugData);
        }, 2000);

    }

    // ----------------------------------------------

    addClientToMap(userData, socket) {
        if (!this.userToSocketsMap.has(userData.id)) {
            let userToSocket = {
                "userData" : userData,
                "sockets" : new Map()
            };
            userToSocket.sockets.set(socket.id,socket);
            this.userToSocketsMap.set(userData.id, userToSocket);
        } else {
            this.userToSocketsMap.get(userData.id).sockets.set(socket.id, socket);
        }
    }

    // ----------------------------------------------

    removeClientFromMap(userData, socket){
        if (this.userToSocketsMap.has(userData.id)) {
            let socketsSet = this.userToSocketsMap.get(userData.id).sockets;
            socketsSet.delete(socket.id);
            if (socketsSet.size === 0 ) {
                this.userToSocketsMap.delete(userData.id);
            }
        }
    }

    // ----------------------------------------------

    getRoomsForUser(userSockets) {

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

    // ----------------------------------------------

    getDebugData() {
        let debugData = {
            users : {}

        };
        this.userToSocketsMap.forEach(function(value, key) {
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
        debugData.totalSockets = this.io.sockets.sockets.size;

        return debugData;
    }

    // ----------------------------------------------

    logMsg(message) {
        this.io.to("debug-room").emit("log-sent", message);
    }

    // ----------------------------------------------

}


module.exports = WebSocketServer;






