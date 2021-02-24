const commandLineArgs = require('command-line-args')

class CliArgs {

    static getOptions () {
        const optionDefinitions = [
            { name: 'forcehttp', alias: 'h', type: Boolean },
            { name: 'port', alias: 'p', type: Number }
        ]

        let defaults = {
            forcehttp : false,
            port : null
        }

        let cliArgs;
        try {
            cliArgs = commandLineArgs(optionDefinitions, { partial: true })
        } catch (e) {
            cliArgs = {};
        }

        let result = {};
        Object.assign(result, defaults, cliArgs)
        delete result._unknown;
        return result;
    }

}

module.exports = CliArgs;