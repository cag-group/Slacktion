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
