const config = require("../config.json");
const CliArgs = require("../classes/CliArgs");

class HttpServer {

    // private fields
    #httpInstance;
    #expressAppInstance;

    constructor() {

        // Get Cli Args
        let cliArgs = CliArgs.getOptions();

        // Get express instance
        this.expressAppInstance = require('express')();

        // Cors Fix
        this.expressAppInstance.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        if(!cliArgs.forcehttp) {
            // HTTPS Certificate
            let fs = require('fs');
            let privateKey  = fs.readFileSync(config.ssl_key_path, 'utf8');
            let certificate = fs.readFileSync(config.ssl_cert_path, 'utf8');
            let credentials = {key: privateKey, cert: certificate};
            // Create server instance
            this.httpInstance = require('https').createServer(credentials, this.expressAppInstance);
        }
        else {
            // Create server instance
            this.httpInstance = require('http').createServer(credentials, this.expressAppInstance);
        }

        let port = cliArgs.port ? cliArgs.port : config.default_port;

        // Start listening
        this.httpInstance.listen(port, () => {
            console.log('listening on *:' + port);
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