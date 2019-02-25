var express = require('express')
var router = express.Router()
var axios = require('axios')
var rp = require('request-promise-native')
var Users = require('../models/Users')
var R = require('ramda')
var crypto = require('crypto')
var ejs = require('ejs')
var path = require('path')
var email = require('../services/email')
var sms = require('../services/sms')
var utils = require('../utils')

var cache = { time: 0, data: [] }

/* Signup */
router.post('/signup', async function(req, res, next) {
  var inp = req.body
  var ret
  if (inp.email === null && inp.mobile === null)
    return res.json({ status: 'error', message: 'One of Email or Mobile should be specified' })
  if (inp.email) {
    ret = await Users.findOne({ email: inp.email }).exec()
    if (ret !== null && ret.authCode.length === 0)
      return res.json({ status: 'error', message: 'Email id ' + inp.email + ' already registered' })
  } else delete inp.email

  if (inp.mobile) {
    ret = await Users.findOne({ mobile: inp.mobile }).exec()
    if (ret !== null && ret.authCode.length === 0)
      return res.json({ status: 'error', message: 'Mobile number ' + inp.mobile + ' already registered' })
  } else delete inp.mobile

  inp.password = crypto
    .createHash('md5')
    .update(inp.password)
    .digest('hex')

  inp.authCode =
    Math.random()
      .toString(10)
      .substring(2, 5) +
    Math.random()
      .toString(10)
      .substring(2, 5)

  if (inp.referralCode) {
    var config = await utils.getConfig()
    if (inp.referralCode === config.global.userReferralCode) inp.role = 'User'
    if (inp.referralCode === config.global.teacherReferralCode) inp.role = 'Teacher'
  }

  if (ret) {
    // update the db
    ret = await Users.findByIdAndUpdate(ret._id, inp)
  } else {
    // insert to  db
    var newuser = new Users(inp)
    ret = await newuser.save()
  }
  if (!ret) return res.json({ status: 'error', message: 'Unable to save to database' })

  if (ret.email) {
    let [err, mailret] = await email.emailSend('OTP', { ...ret._doc, id: ret._id, authCode: inp.authCode })
    if (err) return res.json({ status: 'error', message: 'Unable to send email: ' + err })
  }
  if (!ret.email && ret.mobile) {
    let [err, mailret] = await sms.smsSend('OTP', {
      ...ret._doc,
      id: ret._id,
      authCode: inp.authCode,
      otp: inp.authCode
    })
    if (err) return res.json({ status: 'error', message: 'Unable to send SMS: ' + err })
  }
  return res.json({
    status: 'ok',
    value: {
      id: ret._id
    }
  })
})

/* SignupVerify */
router.post('/signupverify', async function(req, res, next) {
  var inp = req.body
  var ret
  let err = null
  ret = await Users.findOne({ _id: inp.id })
    .exec()
    .catch(e => (err = e.message))
  if (ret === null || err !== null) return res.json({ status: 'error', message: 'Invalid id specified', error: err })
  if (ret.authCode !== inp.otp.toString()) return res.json({ status: 'error', message: 'Invalid OTP specified' })

  await Users.findByIdAndUpdate(inp.id, { authCode: '' })
  return res.json({ status: 'ok', message: ret._id })
})

/* SignupVerify web */
router.get('/signupverify/:id/:otp', async function(req, res, next) {
  var inp = req.body
  var id = req.params.id
  var otp = req.params.otp
  var ret
  let err = null

  ret = await Users.findOne({ _id: id })
    .exec()
    .catch(e => (err = e.message))
  if (ret === null || err !== null) return res.json({ status: 'error', message: 'Invalid id specified', error: err })
  if (ret.authCode !== otp.toString()) return res.json({ status: 'error', message: 'Invalid OTP specified' })

  await Users.findByIdAndUpdate(id, { authCode: '' })
  return res.send('<h2> Thank you ' + ret.name + '</h2> <h3>Signup Successful. Please login from the App</h3>')
})

/* SignupVerify check */
router.post('/signupcheck', async function(req, res, next) {
  var inp = req.body
  var ret

  ret = await Users.findOne({ _id: inp.id }).exec()
  if (ret === null) return res.json({ status: 'error', message: 'Invalid id specified' })
  return res.json({ status: 'ok', value: ret.authCode.length })
})

/* Login */
router.post('/login', async function(req, res, next) {
  var inp = req.body
  var ret
  ret = await Users.findOne({ email: inp.email }).exec()
  if (ret === null) ret = await Users.findOne({ mobile: inp.email }).exec()
  if (ret === null) return res.json({ status: 'error', message: 'Invalid Login Credentials' })

  if (
    ret.password !==
    crypto
      .createHash('md5')
      .update(inp.password)
      .digest('hex')
  )
    return res.json({ status: 'error', message: 'Invalid login credentials' })

  if (ret.disabled === 'Yes') return res.json({ status: 'error', message: 'Access disabled' })

  // eslint-disable-next-line
  if (ret.expoToken != inp.expoToken) {
    await Users.findByIdAndUpdate(ret._id, { expoToken: inp.expoToken })
  }

  await Users.findByIdAndUpdate(ret._id, { lastSeen: new Date() })
  return res.json({
    status: 'ok',
    value: {
      id: ret._id,
      token: ret.token,
      name: ret.name,
      email: ret.email,
      mobile: ret.mobile,
      photo: utils.getPhotoUrl(ret._id, ret.photo),
      role: ret.role,
      group: ret.group,
      rating: ret.rating,
      lastSeen: ret.lastSeen
    }
  })
})

/* Logout */
router.post('/logout', async function(req, res, next) {
  var inp = req.body
  var ret
  ret = await Users.findById(inp.id).exec()
  if (ret === null) return res.json({ status: 'error', message: 'Invalid login id' })

  if (ret.expoToken) await Users.findByIdAndUpdate(ret._id, { expoToken: '' })

  return res.json({ status: 'ok' })
})

/* Reset Password */
router.post('/resetpassword', async function(req, res, next) {
  var inp = req.body
  var ret
  if (inp.email === null && inp.mobile === null)
    return res.json({ status: 'error', message: 'One of Email or Mobile should be specified' })
  var q = {}
  if (inp.email) q.email = inp.email.toLowerCase()
  if (inp.mobile) q.mobile = inp.mobile
  ret = await Users.findOne(q).exec()
  if (ret === null) return res.json({ status: 'error', message: 'Invalid login id for reset password' })

  var password =
    Math.random()
      .toString(36)
      .substring(2, 5) +
    Math.random()
      .toString(36)
      .substring(2, 5)

  var hash = crypto
    .createHash('md5')
    .update(password)
    .digest('hex')

  ret = await Users.findByIdAndUpdate(ret._id, { password: hash })
  var row = { password: password, _id: ret._id, mobile: ret.mobile, email: ret.email, name: ret.name }
  console.log('reset password', password, hash, ret._id)
  if (ret.mobile) await sms.smsSend('ResetPassword', row)
  if (ret.email) await email.emailSend('ResetPassword', row)
  return res.json({ status: 'ok' })
})

/* Reset Password */
router.post('/changepassword', async function(req, res, next) {
  var user = await utils.getLoginUser(req)
  if (!('role' in user)) return res.json({ status: 'error', message: 'Invalid Login Token' })

  var inp = req.body
  var ret
  ret = await Users.findById(inp._id).exec()
  if (ret === null) return res.json({ status: 'error', message: 'Invalid id for change password' })

  if (
    ret.password &&
    ret.password !==
      crypto
        .createHash('md5')
        .update(inp.old_password)
        .digest('hex')
  )
    return res.json({ status: 'error', message: 'Incorrect existing password' })

  var hash = crypto
    .createHash('md5')
    .update(inp.password)
    .digest('hex')

  ret = await Users.findByIdAndUpdate(ret._id, { password: hash })
  console.log('change password', inp.password, hash, ret._id)
  return res.json({ status: 'ok' })
})

/* Google Signin */
router.post('/googlesignin', async function(req, res, next) {
  var inp = req.body
  console.log(inp)
  var signup = false
  var ret
  ret = await Users.findOne({ email: inp.email }).exec()
  if (ret === null) {
    var newuser = new Users(inp)
    ret = await newuser.save()
    signup = true
  } else {
    let upd = {}
    for (let key in inp) {
      if ((key === 'accessToken' || key === 'expoToken') && inp[key] !== ret[key]) upd[key] = inp[key]
      if (key === 'photo' && inp[key].length && !ret[key]) upd[key] = inp[key]
    }
    let out = await Users.findByIdAndUpdate(ret._id, upd).catch(console.log)
  }

  await Users.findByIdAndUpdate(ret._id, { lastSeen: new Date() })

  return res.json({
    status: 'ok',
    value: {
      _id: ret._id,
      id: ret._id,
      token: ret.token,
      accessToken: ret.accessToken,
      name: ret.name,
      email: ret.email,
      mobile: ret.mobile,
      photo: ret.photo,
      group: ret.group,
      role: ret.role
    },
    signup: signup
  })
})

/* Google Signin Complete */
router.post('/googlesignin/complete', async function(req, res, next) {
  var inp = req.body
  console.log('googlesignin complete', inp)
  var ret
  ret = await Users.findById(inp._id).exec()
  if (ret === null) return res.json({ status: 'error', message: 'Invalid login id' })

  if (inp.referralCode) {
    var config = await utils.getConfig()
    if (inp.referralCode === config.global.userReferralCode) inp.role = 'User'
    if (inp.referralCode === config.global.teacherReferralCode) inp.role = 'Teacher'
  }

  if (inp.mobile) {
    ret = await Users.findOne({ mobile: inp.mobile }).exec()
    if (ret !== null)
      return res.json({ status: 'error', message: 'Mobile number ' + inp.mobile + ' already registered' })
  }

  if (inp.role || inp.mobile) {
    ret = await Users.findByIdAndUpdate(inp._id, inp).exec()
    if (ret === null) return res.json({ status: 'error', message: 'Invalid login id' })
    ret = await Users.findById(inp._id).exec()
  }

  return res.json({
    status: 'ok',
    value: {
      id: ret._id,
      token: ret.token,
      accessToken: ret.accessToken,
      name: ret.name,
      email: ret.email,
      mobile: ret.mobile,
      photo: ret.photo,
      group: ret.group,
      role: ret.role
    }
  })
})
module.exports = router
