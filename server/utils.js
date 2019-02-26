var express = require("express")
var router = express.Router()
var axios = require("axios")
var rp = require("request-promise-native")
var Users = require("./models/Users")
var R = require("ramda")
var crypto = require("crypto")
var config = require("./config")
var Cfg = require("./models/Config")

const getLoginUser = async req => {
  if (!("authorization" in req.headers)) return {}
  var m = req.headers["authorization"].match(/^token (.*)/)
  if (m === null) return {}
  var resp = { id: m[1] }
  var ret
  ret = await Users.findById(resp.id)
    .exec()
    .catch(err => console.log(err.message))
  if (ret) {
    resp._id = ret._id
    resp.name = ret.name
    resp.mobile = ret.mobile
    resp.email = ret.email
    resp.role = ret.role
    resp.group = ret.group
    resp.photo = getPhotoUrl(ret._id, ret.photo)
    await Users.findByIdAndUpdate(resp.id, { lastSeen: new Date() })
  }
  return resp
}

// the mobile number or email id should not be repeated or reused
const checkDuplicateUserRecord = async row => {
  const compare = field => {
    return rec => (row[field].toString() === rec[field].toString() ? (row._id ? row._id.toString() !== rec._id.toString() : true) : false)
  }
  if (row.mobile) {
    let ret2 = await Users.find({ mobile: row.mobile })
    ret2 = R.filter(compare("mobile"), ret2 === null ? [] : ret2)
    if (ret2.length) return ["Mobile number " + row.mobile + " already exist"]
  }
  if (row.email) {
    let ret2 = await Users.find({ email: row.email })
    ret2 = R.filter(compare("email"), ret2 === null ? [] : ret2)
    if (ret2.length) return ["Email " + row.email + " already exist"]
  }
  return null
}

const promiseTo = async promise => {
  var err
  let data = await promise.catch(e => {
    err = e
  })
  return [err, data]
}

const getPhotoUrl = (id, photo) => {
  if (photo && photo.length && photo.substr(0, 4) === "data") {
    return config.global.SERVER_IP + "/users/photo/" + id + "/" + photo.length
  }
  return photo === undefined ? "" : photo
}

const getConfig = async () => {
  let db = await Cfg.findOne().exec()
  let cfg = R.mergeDeepLeft(db ? db.data : {}, config)
  return cfg
}

const asyncForEach = async (array, callback) => {
  for (let index = 0; index < array.length; index++) {
    await callback(array[index], index, array)
  }
}

module.exports = {
  getLoginUser,
  checkDuplicateUserRecord,
  promiseTo,
  getPhotoUrl,
  getConfig,
  asyncForEach
}
