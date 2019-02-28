import * as R from "ramda"
import { bindActionCreators } from "redux"
import * as actionCreators from "../actions"
import t from "tcomb-form-native" // 0.6.9
import moment from "moment"
import aesjs from "aes-js"
import md5 from "react-native-md5"
import { Constants, KeepAwake, Audio } from "expo"
var Buffer = require("buffer/").Buffer

export const mapStateToProps = R.curry((base, keys, state) => {
  var r = R.pick(keys, state[base])
  return r
})
export const mapDispatchToProps = dispatch => {
  let actions = bindActionCreators(actionCreators, dispatch)
  return { ...actions, dispatch }
}

export const lastSeen = tm => {
  let diff
  let now = moment()
  let mtm = moment(tm)
  diff = now.diff(mtm, "seconds")
  if (diff < 0 || diff === 0) return "now"
  if (diff < 60) return diff.toString() + " secs ago"
  diff = now.diff(mtm, "minutes")
  if (diff < 0 || diff < 60) return diff.toString() + " mins ago"
  diff = now.diff(mtm, "hours")
  if (diff < 0 || diff < 24) return diff.toString() + " hours ago"
  diff = now.diff(mtm, "days")
  if (diff < 0 || diff < 7) return diff.toString() + " days ago"
  diff = now.diff(mtm, "weeks")
  if (diff < 0 || diff < 5) return diff.toString() + " weeks ago"
  diff = now.diff(mtm, "months")
  return diff.toString() + " months ago"
}

export const humanReadableBytes = bytes => {
  if (bytes / 1000 > 1) {
    if (bytes / 1000 / 1000 > 1) {
      if (bytes / 1000 / 1000 / 1000 > 1) return Math.round((bytes / 1000 / 1000 / 1000) * 100) / 100 + " GB"
      return Math.round((bytes / 1000 / 1000) * 100) / 100 + " MB"
    }
    return Math.round((bytes / 1000) * 100) / 100 + " KB"
  }
  return bytes
}

export const upsertObjectInArray = (array, obj, key) => {
  var idx = array.findIndex(ele => ele[key] === obj[key])
  if (idx >= 0) return [...array.slice(0, idx), Object.assign({}, array[idx], obj), ...array.slice(idx + 1)]
  else return [...array, obj]
}

const Form = t.form.Form
export const formStyles = {
  ...Form.stylesheet,
  formGroup: {
    normal: {
      marginBottom: 10
    }
  },
  datepicker: {
    normal: { borderBottomColor: "gray", borderWidth: 1, marginBottom: 0 },
    error: {
      borderBottomColor: "red",
      borderWidth: 0,
      borderBottomWidth: 3,
      marginBottom: 5
    }
  },
  helpBlock: {
    normal: {
      color: "gray",
      fontSize: 13,
      marginBottom: 2,
      fontStyle: "italic"
    },
    error: { color: "gray", fontSize: 13, marginBottom: 2, fontStyle: "italic" }
  },
  itemStyle: {
    backgroundColor: "blue",
    color: "white"
  },
  controlLabel: {
    normal: {
      color: "darkblue",
      fontSize: 16,
      marginBottom: 5,
      fontWeight: "100"
    },
    // the style applied when a validation error occours
    error: {
      color: "red",
      fontSize: 16,
      marginBottom: 5,
      fontWeight: "500"
    }
  }
}

export const getRegionForCoordinates = points => {
  // courtesy -- https://github.com/react-community/react-native-maps/issues/505
  // points should be an array of { latitude: X, longitude: Y }
  let minX,
    maxX,
    minY,
    maxY

    // init first point
  ;(point => {
    minX = point.latitude
    maxX = point.latitude
    minY = point.longitude
    maxY = point.longitude
  })(points[0])

  // calculate rect
  points.map(point => {
    minX = Math.min(minX, point.latitude)
    maxX = Math.max(maxX, point.latitude)
    minY = Math.min(minY, point.longitude)
    maxY = Math.max(maxY, point.longitude)
  })

  const midX = (minX + maxX) / 2
  const midY = (minY + maxY) / 2
  const deltaX = maxX - minX
  const deltaY = maxY - minY

  return {
    latitude: midX,
    longitude: midY,
    latitudeDelta: deltaX + 5,
    longitudeDelta: deltaY + 5
  }
}

export const materialFormStyles = {
  ...formStyles,
  textbox: {
    normal: { borderBottomColor: "black", borderWidth: 0, marginBottom: 0 },
    error: {
      borderBottomColor: "red",
      borderWidth: 0,
      borderBottomWidth: 3,
      marginBottom: 5
    }
  },
  textboxView: {
    normal: {
      borderBottomColor: "black",
      borderWidth: 0,
      borderRadius: 0,
      borderBottomWidth: 1
    },
    error: {
      borderBottomColor: "red",
      borderWidth: 0,
      borderRadius: 0,
      borderBottomWidth: 1
    }
  }
}

export const tform = {
  Email: t.refinement(t.String, email => {
    /* eslint-disable max-len */
    const reg = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/ // or any other regexp eslint-disable-line
    /* eslint-enable max-len */
    return reg.test(email)
  })
}

export const aesEncrypt = (key, text) => {
  let keyb = Buffer.from(md5.hex_md5(key), "hex")
  let iv = []
  for (let i = 0; i < 16; i++) iv.push(Math.floor(Math.random() * 100))

  const pad = s => {
    let len = s.length
    for (let i = 0; i < 32 - (len % 32); i++) s += String.fromCharCode(32 - (len % 32))
    return s
  }

  var textBytes = aesjs.utils.utf8.toBytes(pad(text))
  var aesCbc = new aesjs.ModeOfOperation.cbc(keyb, iv) // eslint-disable-line
  var encryptedBytes = aesCbc.encrypt(textBytes)
  var encBase64 = Buffer.concat([Buffer.from(iv), Buffer(encryptedBytes)]).toString("base64")
  return encBase64
}

export const appVersion = "v1.0.9"
