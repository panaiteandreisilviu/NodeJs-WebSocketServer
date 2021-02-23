
class HttpServer {

    // private fields
    #httpInstance;
    #expressAppInstance;

    constructor() {

        this.expressAppInstance = require('express')();

        this.expressAppInstance.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        this.httpInstance = require('http').createServer(this.expressAppInstance);

        let cliArgsPort = process.argv.slice(3);

        let port = parseInt(cliArgsPort) ? parseInt(cliArgsPort) : 10000;

        this.httpInstance.listen(port, () => {
            console.log('listening on *:' + port);
            //logMsg('SERVER LISTENING ON *:' + port);
        });

    }

    getHttpInstance () {
        return this.httpInstance;
    }

    getExpressAppInstance () {
        return this.expressAppInstance;
    }

}

module.exports = HttpServer;