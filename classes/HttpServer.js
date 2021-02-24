
class HttpServer {

    // private fields
    #httpInstance;
    #expressAppInstance;

    constructor() {

        // Get express instance
        this.expressAppInstance = require('express')();

        // Cors Fix
        this.expressAppInstance.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        // HTTPS Certificate
        let fs = require('fs');
        let privateKey  = fs.readFileSync('key.pem', 'utf8');
        let certificate = fs.readFileSync('cert.pem', 'utf8');
        let credentials = {key: privateKey, cert: certificate};

        // Create server instance
        this.httpInstance = require('http').createServer(credentials, this.expressAppInstance);

        // CLI Params
        let cliArgsPort = process.argv.slice(3);
        let port = parseInt(cliArgsPort) ? parseInt(cliArgsPort) : 10000;

        // Start listening
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