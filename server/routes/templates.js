var express = require('express')
var router = express.Router()
var axios = require('axios')
var rp = require('request-promise-native')
var Templates = require('../models/Templates')
var R = require('ramda')
var utils = require('../utils')
var crypto = require('crypto')

/* GET ALL Templates */
router.get('/', async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!('role' in user)) return res.json({ status: 'error', message: 'Invalid Login Token' })
  var ret = await Templates.find().exec()
  return res.json({ status: 'ok', templates: ret === null ? [] : ret })
})

// Create a new templates
router.post('/', async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!('role' in user)) return res.json({ status: 'error', message: 'Invalid Login Token' })

  var inp = req.body
  var newTemplate = new Templates(inp)
  var ret = await newTemplate.save()
  if (ret._id) return res.json({ status: 'ok', id: ret._id })
  res.json({ status: 'error', message: 'Creating new record failed' })
})

router.put('/update/:id', async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!('role' in user)) return res.json({ status: 'error', message: 'Invalid Login Token' })

  var inp = req.body
  var id = req.params.id

  var ret = await Templates.findByIdAndUpdate(id, inp).exec()
  if (ret) return res.json({ status: 'ok' })
  return res.json({ status: 'error', message: 'Unable to update the Template record' })
})

module.exports = router
