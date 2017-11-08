# Slacktion.
A command interaction library for slackbots.

This exceptionally beta.

## Usage examples

### As a slack RTM (Real Time Messaging) bot.
```
const SlackBot = require('slackbots')
const Slacktion = require('./slacktion')

const bot = new SlackBot({
  token: 'derp', // Add a bot https://my.slack.com/services/new/bot and put the token
  name: 'caspar-david'
})

bot.on('start', () => {
  console.log(bot.self.id)

  const slacktion = new Slacktion(bot, {
    icon_url: 'https://avatars.slack-edge.com/2017-09-29/248303699665_fa59dfe0711b8a443b12_72.jpg'
  })

  slacktion.registerAction({
    name: 'add',
    description: 'Adds two numbers',
    args: [{name: 'x', optional: false}, {name: 'y', optional: false}],
    fn: async(username, replyFn, x, y) => {
      await replyFn('Adding ' + x + ' and ' + y)
      return parseInt(x) + parseInt(y)
    }
  })

  slacktion.registerAction({
    name: 'sub',
    description: 'Subtracts two numbers',
    args: [{name: 'x', optional: false}, {name: 'y', optional: false}],
    fn: async(username, replyFn, x, y) => {
      await replyFn('subtracting ' + x + ' and ' + y)
      return parseInt(x) - parseInt(y)
    }
  })

  slacktion.start()
})
```


### As a slack app

**NOTE:** If you are running the bot as a slack-app you should
make sure that the action always returns within three seconds or
the request will timeout, you can keep using the
`replyFn` indefinetly(?) though.

```
const Slacktion = require('../lib/slacktion')

module.exports.bot1 = function(req, resp) {
  const slacktion = new Slacktion()

  slacktion.registerAction({
    name: 'add',
    description: 'Adds two numbers',
    args: [{name: 'x', optional: false}, {name: 'y', optional: false}],
    fn: async(username, replyFn, x, y) => {
      await replyFn('Adding ' + x + ' and ' + y)
      return parseInt(x) + parseInt(y)
    }
  })

  slacktion.registerAction({
    name: 'sub',
    description: 'Subtracts two numbers',
    args: [{name: 'x', optional: false}, {name: 'y', optional: false}],
    fn: async(username, replyFn, x, y) => {
      await replyFn('subtracting ' + x + ' and ' + y)
      return parseInt(x) - parseInt(y)
    }
  })

  return slacktion.handleHttpRequest(req, resp)
}
```

## Exposed functions

```
class Slacktion {

  /**
   * Creates a slaction instance.
   *
   * @param bot the slackbot instance for which messages will be listened to.
   * @param params message parameters for the bot to be passed along
   * with all sent messages.
   */
  constructor(bot, params)

  /**
   * Starts listening to messages.
   */
  start()

  /**
   * Returns the function to be exported when running as a google cloud function
   */
  getExportFunction()

  /** Adds a new command to the bot.
   * The action provided should be an object of the following form fields:
   *
   * name:
   *  The name of the command
   * description:
   *  A descriptionof what the command does. Can be ommitted.
   * args:
   *  An array of objects on the form {name, oprional}
   *  the order of these argumens matter and optional
   *  arguments must appear last. Not needed for nullary functions
   * fn:
   *  The actual function corresponding to what the command actually does.
   *  The function should have the following signature:
   *  (username, replyFn, ...commanArguments)
   *  username is the username of the user who issued the command.
   *  replyFn is a function that takes a single argument and sends that
   *  argument as a message to the user who issued the command. The message
   *  will be delivered on a DM.
   *  commandArguments are the arguments to the command issued by the user.
   */
  registerAction(action)
}
```
