import Expo from 'expo-server-sdk'
var Templates = require('../models/Templates')
var Transactions = require('../models/Transactions')
var Users = require('../models/Users')
var utils = require('../utils')
var ejs = require('ejs')
var moment = require('moment')

const notificationSend = async (templName, row, userId) => {
  let err, msg, type, sound
  msg = null
  sound = 'default'

  switch (templName) {
    case 'Logout':
      type = 'logout'
      sound = null
      msg = { template: 'Request you to logout' }
      break

    default:
      return ['Invalid Notification Template name']
  }

  if (!msg) {
    msg = await Templates.findOne({ name: templName, type: 'Notification' })
      .exec()
      .catch(e => (err = e.message))
  }
  if (!msg) return ['Unable to send notification: ' + err]

  let urow = await Users.findById(userId).exec()
  if (!urow || (urow && !urow.expoToken)) return [null, 'Invalid id or No expoToken']

  let body = ejs.render(msg.template, row)
  let [err2, resp] = await sendNotification({
    token: urow.expoToken,
    body: body,
    sound: sound,
    data: { body: ejs.render(msg.template, row), type: type, id: row._id }
  })

  let tr
  tr = new Transactions({
    mode: 'Notification',
    type: err2 ? 'Error' : 'Success',
    recordId: row._id,
    subject: body,
    response: err2 || resp,
    description: type
  })
  await tr.save()

  return [err2, resp]
}

const sendNotification = async ({ token, body, data, sound }) => {
  let expo = new Expo()
  let messages = []
  messages.push({ to: token, sound, body, data })

  const _sendNotification = async chunks => {
    // Send the chunks to the Expo push notification service. There are
    // different strategies you could use. A simple one is to send one chunk at a
    // time, which nicely spreads the load out over time:
    let err, receipts
    receipts = []
    for (let chunk of chunks) {
      receipts.push(await expo.sendPushNotificationsAsync(chunk).catch(e => (err = e.message)))
      console.log('notification', err, chunk, receipts)
    }
    return [err, JSON.stringify(receipts)]
  }

  let chunks = expo.chunkPushNotifications(messages)

  let [err, ret] = await _sendNotification(chunks)
  return [err, ret]
}

module.exports = {
  notificationSend
}
