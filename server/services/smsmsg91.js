var axios = require('axios')
var rp = require('request-promise-native')
var R = require('ramda')
var moment = require('moment')
var Transactions = require('../models/Transactions')
var utils = require('../utils')

export const sendSMS = async sms => {
  var mobile = sms.mobile.toString()
  mobile = mobile.replace(/\s+/, '')
  if (mobile.length === 10) mobile = '91' + mobile
  else if (mobile.length === 13 && mobile.substr(0, 3) === '+91') mobile = mobile.substr(1)

  // http://api.msg91.com/api/sendhttp.php?sender=ISHAPI&route=4&mobiles=9980018517&
  // authkey=221837AqiQBg3Z5b2ca1fb&country=91&
  // message=Dear Moorthy, Welcome to App

  var config = await utils.getConfig()

  let err, tr, ret
  var resp = await rp
    .get({
      uri: 'http://api.msg91.com/api/sendhttp.php',
      qs: {
        authkey: config.smsmsg91.authkey,
        sender: 'ISHAPI',
        route: '4',
        mobiles: mobile,
        country: '91',
        message: sms.message
      }
    })
    .catch(e => (err = e.message))

  if (err)
    tr = new Transactions({
      mode: 'SMS',
      type: 'Error',
      recordId: sms._id,
      subject: sms.message,
      to: sms.mobile,
      description: err
    })
  else
    tr = new Transactions({
      mode: 'SMS',
      type: 'Success',
      recordId: sms._id,
      subject: sms.message,
      to: sms.mobile,
      description: resp
    })

  ret = await tr.save()
  return [err, resp]
}
