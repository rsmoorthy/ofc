var express = require('express')
var router = express.Router()
var axios = require('axios')
var rp = require('request-promise-native')
var Config = require('../models/Config')
var R = require('ramda')
var utils = require('../utils')
var crypto = require('crypto')
var forge = require('node-forge')

/* GET ALL Config */
router.get('/', async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!('role' in user)) return res.json({ status: 'error', message: 'Invalid Login Token' })
  if (user.role !== 'Admin') return res.json({ status: 'error', message: 'Invalid Login Token' })

  var ret = await Config.findOne().exec()
  // console.log('returning', ret.data)
  return res.json({ status: 'ok', config: ret === null ? {} : ret.data })
})

// Update Config
router.put('/', async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!('role' in user)) return res.json({ status: 'error', message: 'Invalid Login Token' })
  if (user.role !== 'Admin') return res.json({ status: 'error', message: 'Invalid Login Token' })

  var inp = req.body
  var id = req.params.id

  var cfg

  var rec = await Config.findOne().exec()
  if (rec === null) cfg = {}
  else cfg = rec.data ? rec.data : {}

  let x = ['1', '2', '3', '4', '5', '6'].map(item => {
    var k = 'privateKey' + item
    if (inp.pi && inp.pi[k] && inp.pi[k] === 'create' && cfg.pi && !cfg.pi[k]) {
      var pair = forge.pki.rsa.generateKeyPair(2048)
      inp.pi[k] = forge.pki.privateKeyToPem(pair.privateKey)
    }
    k = 'key' + item
    if (inp.pi && inp.pi[k] && inp.pi[k] === 'create' && cfg.pi && !cfg.pi[k]) {
      var md = forge.md.sha256.create()
      md.update(
        Math.random()
          .toString(36)
          .slice(-8) +
          Math.random()
            .toString(36)
            .slice(-8) +
          Math.random()
            .toString(36)
            .slice(-8)
      )
      inp.pi[k] = md.digest().toHex()
    }
  })

  cfg = R.mergeDeepRight(cfg, inp)

  // console.log('cfg', cfg, rec)
  if (rec && rec._id) await Config.findByIdAndUpdate(rec._id, { data: cfg }).exec()
  else {
    var ret = new Config({ data: cfg })
    let r = await ret.save().catch(err => console.log(err.message))
    // console.log('saved data', r)
  }

  rec = await Config.findOne().exec()
  if (rec) {
    // console.log('rec.data', rec.data)
    return res.json({ status: 'ok', config: rec.data })
  }
  return res.json({ status: 'error', message: 'Unable to update the Config record' })
})

module.exports = router
