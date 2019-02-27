var express = require("express")
var router = express.Router()
var axios = require("axios")
var rp = require("request-promise-native")
var Config = require("../models/Config")
var Checkins = require("../models/Checkins")
var R = require("ramda")
var utils = require("../utils")
var crypto = require("crypto")
var forge = require("node-forge")
var moment = require("moment")

const begOfDay = input => {
  let dt = input ? new Date(input) : new Date()
  dt.setHours(0)
  dt.setMinutes(0)
  dt.setSeconds(0)
  return dt
}

const endOfDay = input => {
  let dt = input ? new Date(input) : new Date()
  dt.setHours(23)
  dt.setMinutes(59)
  dt.setSeconds(59)
  return dt
}

/* Insert records */
router.put("/insert", async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!("role" in user)) return res.json({ status: "error", message: "Invalid Login Token" })
  if (user.role !== "Admin") return res.json({ status: "error", message: "Invalid Login Token" })
  var ret = await Config.findOne().exec()

  var inp = req.body
  if (!inp.rows) return res.json({ status: "error", message: "Parameter rows not provided" })
  var results = []
  var count = 0
  await utils.asyncForEach(inp.rows, async row => {
    if (!row.yatraid || !row.name || !row.mobile || !row.age || !row.travelGroup || !row.barcode)
      return results.push({ error: "Incomplete record", row: row })

    if (await Checkins.findOne({ yatraid: row.yatraid, name: row.name, mobile: row.mobile }).exec())
      return results.push({ error: "Record already seems to exist", row: row })
    var newrow = new Checkins(row)
    ret = await newrow.save()
    count++
  })

  return res.json({ status: "ok", count: count, results: results })
})

/* Do checkin */
router.put("/checkin/:barcode", async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!("role" in user)) return res.json({ status: "error", message: "Invalid Login Token" })
  if (user.role === "None") return res.json({ status: "error", message: "Invalid Login Token" })
  var ret = await Config.findOne().exec()

  var barcode = req.params.barcode
  if (!barcode) return res.json({ status: "error", message: "Invalid parameter barcode" })
  var inp = req.body
  if (!(inp && inp.location && inp.direction)) return res.json({ status: "error", message: "Location and Direction not set" })

  var row = await Checkins.findOne({ barcode: barcode }).exec()
  if (row === null) return res.json({ status: "error", message: "No valid barcode (" + barcode + ") found" })

  var updates = {}
  console.log("date", inp.date)
  inp.date = inp.date ? moment(inp.date) : moment()
  if (!row.checkinData) row.checkinData = []
  let idx = row.checkinData.findIndex(item => item.location === inp.location && item.direction === inp.direction)
  if (idx >= 0) row.checkinData[idx].date = inp.date
  else
    row.checkinData.push({
      location: inp.location,
      direction: inp.direction,
      date: inp.date
    })

  var loc = ""
  row.checkinData.forEach(crow => {
    if (!loc && crow.direction === "In") {
      loc = crow.location
      if (!row.checkinDate) updates.checkinDate = crow.date
      return
    }
    if (loc && loc === crow.location && crow.direction === "Out") {
      if (!row.checkoutDate) updates.checkoutDate = crow.date
    }
  })
  updates.checkinData = row.checkinData
  updates.lastSeenDate = inp.date
  // row.markModified('checkinData')
  ret = await Checkins.findByIdAndUpdate(row._id, updates)
  if (!ret) return res.json({ status: "error", message: "Unable to save to database" })

  // console.log('returning', ret.data)
  return res.json({ status: "ok", checkin: { ...row._doc, ...updates } })
})

/* Get user record */
router.get("/locations", async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!("role" in user)) return res.json({ status: "error", message: "Invalid Login Token" })
  if (user.role === "None") return res.json({ status: "error", message: "Invalid Login Token" })
  var cfg = await Config.findOne().exec()

  return res.json({
    status: "ok",
    locations: cfg.data.global && cfg.data.global.location && cfg.data.global.location.length ? cfg.data.global.location.split("\n") : []
  })
})

/* Get user record */
router.get("/checkin/:barcode", async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!("role" in user)) return res.json({ status: "error", message: "Invalid Login Token" })
  if (user.role === "None") return res.json({ status: "error", message: "Invalid Login Token" })
  var ret = await Config.findOne().exec()

  var barcode = req.params.barcode
  var row = await Checkins.findOne({ barcode: barcode }).exec()
  if (row === null) return res.json({ status: "error", message: "No valid barcode found" })
  return res.json({ status: "ok", checkin: row })
})

/* Search checkin */
router.get("/search", async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!("role" in user)) return res.json({ status: "error", message: "Invalid Login Token" })
  if (user.role === "None") return res.json({ status: "error", message: "Invalid Login Token" })
  var ret = await Config.findOne().exec()

  var inp = req.body
  var q = {}
  if (inp.name) q.name = { $regex: "/" + inp.name + "/", $options: "i" }
  if (inp.mobile) q.mobile = { $regex: "/" + inp.mobile + "/" }
  if (inp.center) q.center = { $regex: "/" + inp.center + "/", $options: "i" }
  if (inp.age && inp.age.indexOf("-") === -1) q.age = inp.age
  if (inp.age && inp.age.indexOf("-")) {
    let ages = inp.age.split("-")
    if (ages.length === 2) q.age = { $gte: parseInt(ages[0]), $lte: parseInt(ages[1]) }
  }
  if (q.length === 0) return res.json({ status: "error", message: "No search parameter" })
  var rows = await Checkins.find(q).exec()
  return res.json({ status: "ok", checkins: rows })
})

/* Custom Queries */
router.get("/query/:query", async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!("role" in user)) return res.json({ status: "error", message: "Invalid Login Token" })
  if (user.role === "None") return res.json({ status: "error", message: "Invalid Login Token" })
  var ret = await Config.findOne().exec()

  var inp = req.body
  var query = req.params.query
  var q = {}
  if (query === "CheckinList") q.checkinDate = { $gt: begOfDay(req.query.checkinDate), $lt: endOfDay(req.query.checkinDate) }
  if (query === "NotCheckedOut") {
    if (req.query.checkinDate) q.checkinDate = { $gt: begOfDay(req.query.checkinDate), $lt: endOfDay(req.query.checkinDate) }
    q.checkoutDate = { $exists: false }
  }
  if (query === "AbsenteeList") q.checkinDate = { $exists: false }

  var rows = await Checkins.find(q).exec()
  return res.json({ status: "ok", checkins: rows })
})

/* Summary Queries */
router.get("/summary", async (req, res, next) => {
  var user = await utils.getLoginUser(req)
  if (!("role" in user)) return res.json({ status: "error", message: "Invalid Login Token" })
  if (user.role === "None") return res.json({ status: "error", message: "Invalid Login Token" })
  var ret = await Config.findOne().exec()

  var inp = req.body
  var q = {}
  q.checkinDate = { $gt: begOfDay(req.query.checkinDate), $lt: endOfDay(req.query.checkinDate) }
  var summary = { checkins: 0, checkouts: 0, absentees: 0 }

  summary.checkins = await Checkins.count(q).exec()
  summary.checkouts = await Checkins.count({
    ...q,
    checkoutDate: { $gt: begOfDay(req.query.checkinDate), $lt: endOfDay(req.query.checkinDate) }
  }).exec()
  summary.absentees = await Checkins.count({ checkinDate: { $exists: false } }).exec()
  /*
  var allrecords = await Checkins.find({}).exec()
  summary.locationwise = {}
  allrecords = allrecords || []
  console.log(allrecords)
  allrecords.forEach(row => {
    var loc = {}
    row.checkinData.forEach(item => {
      if (!(item.location in loc)) loc[item.location] = {}
      loc[item.location][item.direction] = item.date
    })
    for (var l in loc) {
      if (!(l in summary.locationwise)) summary.locationwise[l] = { In: 0, Out: 0 }
      if ("In" in loc[l]) summary.locationwise[l]["In"] += 1
      if ("Out" in loc[l]) summary.locationwise[l]["In"] += 1
    }
  })
  */

  return res.json({ status: "ok", summary: summary })
})

module.exports = router
