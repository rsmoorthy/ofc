var express = require('express')
var router = express.Router()
var axios = require('axios')
var rp = require('request-promise-native')
var Users = require('../models/Users')
var R = require('ramda')
var utils = require('../utils')
var crypto = require('crypto')
var notifications = require('../services/notifications')

/* GET ALL Users */
router.get('/:query?', async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!('role' in user)) return res.json({ status: 'error', message: 'Invalid Login Token' })
  var query = req.param.query

  var q = {}
  if (query) {
    let [k, v] = query.split('=')
    if (k && v) q[k] = v
  }

  var ret = await Users.find(q, {
    name: 1,
    email: 1,
    mobile: 1,
    role: 1,
    photo: 1,
    disabled: 1,
    lastSeen: 1,
    rating: 1,
    group: 1
  }).exec()
  ret.forEach(u => (u.photo = utils.getPhotoUrl(u._id, u.photo)))
  return res.json({ status: 'ok', users: ret === null ? [] : ret })
})

/* Get Photo */
router.get('/photo/:id/:len?', async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  // if (!('role' in user)) return res.json({ status: 'error', message: 'Invalid Login Token' })
  var id = req.params.id

  var ret = await Users.findById(id, { photo: 1 }).exec()
  if (ret && ret.photo && ret.photo.length && ret.photo.substr(0, 4) === 'data') {
    let photo = ret.photo.replace(/^data:image\/jpeg;base64,/, '')
    res.contentType('image/jpeg')
    return res.send(Buffer.from(photo, 'base64'))
  }
  return res.sendStatus(404)
  // return res.json({ status: 'ok', photo: ret === null ? '' : ret.photo })
})

router.post('/update/:id', async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!('role' in user)) return res.json({ status: 'error', message: 'Invalid Login Token' })

  var inp = req.body
  var id = req.params.id

  let err = await utils.checkDuplicateUserRecord({ ...inp, _id: id })
  if (err) return res.json({ status: 'error', message: err })

  for (var key in inp) if (inp[key] === '' || inp[key] === null) delete inp[key]
  delete inp._id
  delete inp.id

  if (inp.password && inp.password !== null && inp.password.length) {
    inp.password = crypto
      .createHash('md5')
      .update(inp.password)
      .digest('hex')
  }

  var row = await Users.findById(id).exec()

  var ret = await Users.findByIdAndUpdate(id, inp).exec()
  if (ret) {
    if (inp.role && inp.role !== row.role && row.expoToken) {
      let p = await notifications.notificationSend('Logout', {}, row._id)
      console.log('logout notification', p)
    }
    ret = { ...ret._doc }
    ret.photo = utils.getPhotoUrl(ret._id, ret.photo)
    return res.json({ status: 'ok', user: ret })
  }
  return res.json({ status: 'error', message: 'Unable to update the User record' })
})

module.exports = router
