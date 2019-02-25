var Templates = require('../models/Templates')
var Users = require('../models/Users')
var utils = require('../utils')
var ejs = require('ejs')
var path = require('path')
var emailaws = require('../services/emailaws')
var moment = require('moment')

const emailSend = async (templName, row) => {
  let file, subject
  switch (templName) {
    case 'OTP':
      file = path.join(__dirname, '../templates/email_newaccount.ejs')
      subject = 'Please verify your account'
      if (!row.otp) row.otp = row.authCode
      break

    case 'ResetPassword':
      file = path.join(__dirname, '../templates/email_resetpassword.ejs')
      subject = 'Your password has been reset'
      break

    default:
      return ['Invalid Email Template name']
  }

  if (!row.email) return [null, '']

  let err
  let html = await ejs.renderFile(file, row).catch(e => (err = e.message))
  if (err) return [err]

  {
    let [err, out] = await emailaws.sendEmail({
      from: 'no-reply@rsmoorthy.net',
      to: row.email,
      subject: subject,
      html: html
    })
    return [err, out]
  }
}

module.exports = {
  emailSend
}
