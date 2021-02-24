
class CliArgs {

    static getOptions () {
        const optionDefinitions = [
            { name: 'forcehttp', alias: 'h', type: Boolean },
            { name: 'port', alias: 'p', type: Number }
        ]
        const commandLineArgs = require('command-line-args')

        return commandLineArgs(optionDefinitions)
    }

}

module.exports = CliArgs;