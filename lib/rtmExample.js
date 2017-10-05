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
