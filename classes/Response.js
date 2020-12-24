
class Response {

    success;
    result;
    message;

    constructor(success = true, result = null, message = null) {
        this.success = success;
        this.result = result;
        this.message = message;
    }
}

module.exports = Response;