const bodyParser = require('body-parser');
const config = require("../config.json");

class Routes {

    static initRoutes(httpServer, webSocketServer) {

        let jsonParser = bodyParser.json()

        let app = httpServer.getExpressAppInstance()

        app.post('/test', jsonParser, (req, res) => {
            io.emit('chat message', req.data);
            res.json({"result" : true})
        });

        app.post('/debug', jsonParser, (req, res) => {
            let debugData = webSocketServer.getDebugData();
            res.json({"result" : debugData})
        });

        app.post('/test-logging', jsonParser, (req, res) => {
            let counter = 0;
            let start = new Date();
            let interval = setInterval(function () {
                counter++;
                webSocketServer.logMsg("TESTING LOGS - " + counter + "/2000");
                if (counter == 2000) {
                    let stop = new Date();
                    let duration = stop.getTime() - start.getTime();
                    //webSocketServer.logMsg("DURATION: " + (duration / 1000).toFixed(2) + "s");
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

            webSocketServer.logMsg("SR EVENT: ".padEnd(15, " ") + event + " users: " + JSON.stringify(users) + " rooms: " + rooms + " data: " + JSON.stringify(eventData));

            if(rooms.constructor === Array && rooms.length) {
                rooms.map(function(room) {
                    io.to(room).emit(event, eventData)
                });
            } else if(users.constructor === Array && users.length) {
                users.forEach(function(userId) {
                    userId = userId.toString();
                    webSocketServer.logMsg(userId);
                    if(userToSocketsMap.has(userId)) {
                        webSocketServer.logMsg(userId);
                        let userSockets = userToSocketsMap.get(userId).sockets;
                        webSocketServer.logMsg("sockets:" + userToSocketsMap.get(userId).sockets.size);

                        userSockets.forEach(function (socket) {
                            webSocketServer.logMsg(event + " " + JSON.stringify(eventData) + " " + socket.id);
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
    }

}

module.exports = Routes;