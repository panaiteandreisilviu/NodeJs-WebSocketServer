
class HttpServer {
    constructor() {

    }
    static static_field = "static";
    static static_func(a, b) {
        return a + b;
    }
}

module.exports = {
    HttpServer: HttpServer
}