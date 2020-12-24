const bodyParser = require('body-parser');
const Response = require('./Response');
const config = require("../config.json");

class Routes {

    /**
     * @param {HttpServer} httpServer
     * @param {WebSocketServer} webSocketServer
     */
    static initRoutes(httpServer, webSocketServer) {

        let jsonParser = bodyParser.json()
        let app = httpServer.getExpressAppInstance()

        // ---------------------------------

        app.post('/test', jsonParser, (req, res) => {
            io.emit('chat message', req.data);
            res.json(new Response(true))
        });

        // ---------------------------------

        app.post('/debug', jsonParser, (req, res) => {
            let debugData = webSocketServer.getDebugData();
            res.json(new Response(true, debugData));
        });

        // ---------------------------------

        app.post('/event', jsonParser, (req, res) => {
            let requestBody = req.body

            if(requestBody.token !== config.token) {
                res.json(new Response(false, null, "Invalid authentication token"))
            }

            webSocketServer.sendEvent(req.body);
            res.json(new Response(true))
        });

        // ---------------------------------

        app.post('/test-logging', jsonParser, (req, res) => {
            let counter = 0;
            let start = new Date();
            let interval = setInterval(function () {
                counter++;
                webSocketServer.logMsg("TESTING LOGS - " + counter + "/2000");
                if (counter === 2000) {
                    let stop = new Date();
                    let duration = stop.getTime() - start.getTime();
                    clearInterval(interval);
                }
            }, 1);

            res.json(new Response(true));
        });

        // ---------------------------------

    }

}

module.exports = Routes;