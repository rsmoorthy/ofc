import { promiseTo } from '../utils'
var axios = require('axios')
var rp = require('request-promise')
var R = require('ramda')
var moment = require('moment')
var aws = require('aws-sdk')
var nodemailer = require('nodemailer')
var Transactions = require('../models/Transactions')

var utils = require('../utils')

export const sendEmail = async email => {
  var config = await utils.getConfig()
  aws.config.update(config['sesaws'])
  var transporter = nodemailer.createTransport({
    SES: new aws.SES(),
    sendingRate: 1
  })
  var params = {}
  params.from = email.from
  params.to = email.to
  params.subject = email.subject
  if (email.cc) params.cc = email.cc
  if (email.bcc) params.bcc = email.bcc
  if (email.text) params.text = email.text
  if (email.html) params.html = email.html
  if (email.attachments) params.attachments = email.attachments

  let err = null
  let resp = await transporter.sendMail(params).catch(e => {
    err = e.message
  })

  let tr
  if (err)
    tr = new Transactions({
      mode: 'Email',
      type: 'Error',
      recordId: email._id,
      subject: email.subject,
      to: email.to,
      descripion: err
    })
  else
    tr = new Transactions({
      mode: 'Email',
      type: 'Success',
      recordId: email._id,
      subject: email.subject,
      to: email.to,
      descripion: resp.toString(),
      response: resp.toString()
    })

  await tr.save()
  return [err, resp]
}

export const sendEmail2 = async email => {
  const ses = new aws.SES()
  var config = await utils.getConfig()
  aws.config.update(config['sesaws'])

  let [err, ret] = await promiseTo(
    ses
      .sendEmail({
        Destination: {
          ToAddresses: email.to
        },
        Message: {
          Body: {
            Html: {
              Charset: 'UTF-8',
              Data: email.html
            },
            Text: {
              Charset: 'UTF-8',
              Data: email.text
            },
            Subject: {
              Charset: 'UTF-8',
              Data: email.subject
            }
          },
          Source: email.from,
          ReplyToAddresses: [email.from]
        }
      })
      .promise()
  )

  return [err, ret]
}
