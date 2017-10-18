const request = require('superagent')

class Slacktion {

  /**
   * Creates a slaction instance.
   *
   * @param bot the slackbot instance for which messages will be listened to.
   * @param params message parameters for the bot to be passed along
   * with all sent messages.
   */
  constructor(bot, params) {
    if (bot !== undefined) {
      this.botId = bot.self.id
      this.bot = bot
      this.params = params
      this.rtmBot = true
    } else {
      this.rtmBot = false
    }
    this.actions = {}
  }

  /**
   * Starts listening to messages.
   */
  startListner() {
    if (!this.rtmBot) {
      throw Error('Listner not applicable for use with HTTP hooks')
    }
    this.bot.on('message', message => {
      this._handleMessage(message)
    })
  }

  getExportFunction() {
    if (this.rtmBot) {
      throw Error('Exportfunction not applicable for RTM bots')
    }
    return (req, resp) => {
      this._dispatchAction(parseMessage(req.body.text), req.body.user_name, req.body.response_url)
        .then(res => resp.status(200).send(res + '')) // Slack intreprets ints as response codes
        .catch(err => resp.status(200).send((err.message || err) + ''))
    }
  }

  _handleMessage(message) {
    if (message.user === this.botId) {
      return
    }

    switch (message.type) {
      case 'message':
        if (message.subtype === 'message_changed') {
          message = message.message
        }
        if (message.user !== undefined) {
          // TODO: Make PR to slackbots for this functionality
          this.bot._api('users.info', {user: message.user}).then(resp => {
            const userName = resp.user.name
            this._dispatchAction(parseMessage(message.text), userName)
              .then(res => this.bot.postMessageToUser(userName, res, this.params))
              .catch(err => this.bot.postMessageToUser(userName, err.message || err, this.params))
          })
        }
        break
    }
  }

  async _dispatchAction(message, userName, responseUrl) {
    if (message.actionName === 'help') {
      return this._makeHelpText(message.args[0])
    }

    if (message.actionName === '') {
      throw Error('Please provide a command. Type `help` for more info')
    }

    if (this.actions[message.actionName] === undefined) {
      throw Error('`' + message.actionName + '`' + ' is not a recognized command. Type `help` for more info')
    }

    const action = this.actions[message.actionName]

    if (action.minArgCount > message.args.length) {
      throw Error('`' + message.actionName + '`' + ' requires at least ' + action.minArgCount + ' arguments.')
    }

    let replyFn
    if (this.rtmBot) {
      const self = this
      replyFn = data => new Promise((resolve, reject) => {
        self.bot.postMessageToUser(userName, data, self.params)
          .then(resp => {
            resolve(resp)
          })
          .catch(err => {
            console.error('Sending reply failed:', err)
            reject(err)
          })
      })
    } else {
      replyFn = data => new Promise((resolve, reject) => {
        request.post(responseUrl).send({'response_type': 'ephemeral', text: data}).end((err, resp) => {
          if (err) {
            console.error('Error sending reply:', err)
            reject(err)
            return
          }
          resolve(resp)
        })
      })
    }
    return action.fn(userName, replyFn, ...message.args)
  }

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
   *
   * fn:
   *  The actual function corresponding to what the command actually does.
   *  The function should have the following signature when running as an RTM bot:
   *  (username, replyFn, ...commandArguments)
   *  username is the username of the user who issued the command.
   *  replyFn is a function that takes a single argument and sends that
   *  argument as a message to the user who issued the command. The message
   *  will be delivered on a DM.
   *  commandArguments are the arguments to the command issued by the user.
   */
  registerAction(action) {
    if (action.name === undefined) {
      throw Error('A name for the action needs to be provided')
    }

    const newAction = {}
    newAction.name = action.name
    newAction.description = action.description

    let wasOptional = false
    let minArgCount = 0
    newAction.args = []
    for (let arg of action.args) {
      if (wasOptional && !arg.optional) {
        throw Error('A non optional argument must not be preceeded by an optional argument')
      }
      if (!arg.optional) {
        minArgCount++
      }
      wasOptional = arg.optional
      newAction.args.push(arg)
    }
    newAction.minArgCount = minArgCount

    if (typeof action.fn !== 'function') {
      throw Error('The action needs to be a function')
    }

    newAction.fn = action.fn
    this.actions[action.name] = newAction
  }

  registerActions(actionArray) {
    for (let action of actionArray) {
      this.registerAction(action)
    }
  }

  _makeHelpText(actionName) {

    function formatMessage(action) {
      let string = '`' + action.name + '`'
      for (let arg of action.args) {
        if (arg.optional) {
          string += ' `[' + arg.name + ']`'
        } else {
          string += ' `' + arg.name + '`'
        }
      }
      if (action.description !== undefined) {
        string += '\n' + action.description
      }
      return string
    }

    if (actionName) {
      if (this.actions[actionName]) {
        return formatMessage(this.actions[actionName])
      } else {
        throw Error('The command `' + actionName + '` does not exist.')
      }
    } else {
      let string = ''
      for (let action in this.actions) {
        string += formatMessage(this.actions[action]) + '\n\n'
      }
      return string
    }
  }

}

function parseMessage(text) {
  let str = text.trim()
  let head = 0
  while (str[head] !== undefined && str[head] !== ' ') {
    head++
  }
  const actionName = str.substring(0, head)
  head++

  const args = []
  let start = head
  let inString = false
  let trailing = false

  while (str[head] !== undefined) {
    switch (str[head]) {
      case ' ':
        if (!inString && !trailing) {
          args.push(str.substring(start, head))
          head++
          start = head
          trailing = true
        } else if (trailing) {
          head++
          start++
        } else {
          head++
        }
        break
      case '\\':
        trailing = false
        if (str[head + 1] === '"') {
          head += 2
        }
        break
      case '"':
        trailing = false
        inString = !inString
        head++
        break
      default:
        trailing = false
        head++
    }
  }

  args.push(str.substring(start, head))
  return {actionName, args}
}

module.exports = Slacktion
