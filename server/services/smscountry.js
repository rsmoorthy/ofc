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

  var config = await utils.getConfig()

  let err, tr, ret
  var resp = await rp
    .get({
      uri: 'http://api.smscountry.com/SMSCwebservice_bulk.aspx',
      qs: {
        User: config.smscountry.User,
        passwd: config.smscountry.passwd,
        mobilenumber: mobile,
        message: sms.message,
        sid: config.smscountry.sid,
        mtype: 'N',
        DR: 'Y'
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
