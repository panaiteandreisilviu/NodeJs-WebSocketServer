
class HttpServer {

    // private fields
    #httpInstance;
    #expressAppInstance;

    constructor() {

        this.expressAppInstance = require('express')();

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