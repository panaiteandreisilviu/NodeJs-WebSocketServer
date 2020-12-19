const HttpServer = require("./classes/HttpServer");
const WebSocketServer = require("./classes/WebSocketServer");
const Routes = require("./classes/Routes");

let httpServer = new HttpServer();
let webSocketServer = new WebSocketServer((httpServer.getHttpInstance()));
Routes.initRoutes(httpServer, webSocketServer);