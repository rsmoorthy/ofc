import md5 from "md5"
import axios from "axios"
import qs from "qs"
import config from "../config"
import moment from "moment"

const hostip = config.SERVER_IP ? config.SERVER_IP : "https://ofc.rsmoorthy.net"
// const hostip = 'http://192.168.0.113:3000'
const host = hostip
console.log("host", host, process.env.SERVER_IP, process.env, config.SERVER_IP)

export const getUserList = role => {
  return (dispatch, getState) => {
    dispatch({ type: "USER_LIST_IN_PROGRESS" })
    const state = getState()
    axios({
      method: "GET",
      url: host + "/users" + (role ? "/role=" + role : ""),
      headers: {
        Authorization: "token " + state.ofc.login.token
      }
    })
      .then(response => {
        if (response.data.status === "ok") dispatch({ type: "USER_LIST", users: response.data.users })
        else dispatch({ type: "USER_LIST", users: [] })
      })
      .catch(error => {
        console.log("error.message", error.message)
      })
  }
}

export const doSignup = value => {
  return (dispatch, getState) => {
    dispatch({ type: "SIGNUP_IN_PROGRESS", verify: false })

    axios
      .post(host + "/auth/signup", value)
      .then(response => {
        if (response.data.status === "ok") dispatch({ type: "SIGNUP_VERIFY", id: response.data.value.id })
        else
          dispatch({
            type: "SIGNUP_FAILURE",
            message: response.data.message,
            verify: false
          })
      })
      .catch(error => {
        dispatch({
          type: "SIGNUP_FAILURE",
          message: error.message,
          verify: false
        })
      })
  }
}

export const doSignupVerify = value => {
  return (dispatch, getState) => {
    dispatch({ type: "SIGNUP_IN_PROGRESS", verify: true })

    axios
      .post(host + "/auth/signupverify", value)
      .then(response => {
        if (response.data.status === "ok") dispatch({ type: "SIGNUP_SUCCESS", verify: true })
        else
          dispatch({
            type: "SIGNUP_FAILURE",
            message: response.data.message,
            verify: true
          })
      })
      .catch(error => {
        dispatch({
          type: "SIGNUP_FAILURE",
          message: error.message,
          verify: true
        })
      })
  }
}

export const doLogin = value => {
  return (dispatch, getState) => {
    dispatch({ type: "LOGIN_IN_PROGRESS" })
    let state = getState()
    value = { ...value }
    value.expoToken = state.ofc.expoToken

    axios
      .post(host + "/auth/login", value)
      .then(response => {
        if (response.data.status === "ok") dispatch({ type: "LOGIN_SUCCESS", value: response.data.value })
        else dispatch({ type: "LOGIN_FAILURE", message: response.data.message })
      })
      .catch(error => {
        dispatch({ type: "LOGIN_FAILURE", message: error.message })
      })
  }
}

export const doGoogleSignin = (value, callback) => {
  return (dispatch, getState) => {
    dispatch({ type: "LOGIN_IN_PROGRESS" })
    let state = getState()
    value = { ...value }
    value.expoToken = state.ofc.expoToken

    axios
      .post(host + "/auth/googlesignin", value)
      .then(response => {
        if (response.data.status === "ok") {
          if (response.data.signup === false) dispatch({ type: "LOGIN_SUCCESS", value: response.data.value })
          if (callback) callback(null, response.data)
        } else {
          if (callback) callback(response.data.message)
          dispatch({ type: "LOGIN_FAILURE", message: response.data.message })
        }
      })
      .catch(error => {
        if (callback) callback(error.message)
        dispatch({ type: "LOGIN_FAILURE", message: error.message })
      })
  }
}

export const doGoogleSigninComplete = (value, callback) => {
  return (dispatch, getState) => {
    dispatch({ type: "LOGIN_IN_PROGRESS" })
    value = { ...value }

    axios
      .post(host + "/auth/googlesignin/complete", value)
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "LOGIN_SUCCESS", value: response.data.value })
          if (callback) callback(null, response.data)
        } else {
          if (callback) callback(response.data.message)
          dispatch({ type: "LOGIN_FAILURE", message: response.data.message })
        }
      })
      .catch(error => {
        if (callback) callback(error.message)
        dispatch({ type: "LOGIN_FAILURE", message: error.message })
      })
  }
}

export const doLogout = () => {
  return (dispatch, getState) => {
    let state = getState()
    var id = state.ofc.login.id
    var expoToken = state.ofc.login.expoToken
    dispatch({ type: "LOGOUT" })
    axios
      .post(host + "/auth/logout", { id, expoToken })
      .then(response => {})
      .catch(error => {
        console.log(error.message)
      })
  }
}

export const resetSignup = () => ({
  type: "SIGNUP_RESET"
})

export const signupCheck = id => {
  return (dispatch, getState) => {
    axios
      .post(host + "/auth/signupcheck", { id: id })
      .then(response => {
        if (response.data.status === "ok" && response.data.value === 0) dispatch({ type: "SIGNUP_SUCCESS", verify: true })
      })
      .catch()
  }
}

export const doUpdateUser = value => {
  return (dispatch, getState) => {
    const state = getState()
    dispatch({ type: "UPDATE_USER_RESET" })
    axios({
      method: "POST",
      url: host + "/users/update/" + value._id,
      data: value,
      headers: {
        Authorization: "token " + state.ofc.login.token
      }
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "UPDATE_USER_SUCCESS", user: value })
          setTimeout(() => dispatch({ type: "UPDATE_USER_RESET" }), 8000)
          getUserList()(dispatch, getState)
        } else
          dispatch({
            type: "UPDATE_USER_FAILURE",
            message: response.data.message
          })
      })
      .catch(error => {
        dispatch({ type: "UPDATE_USER_FAILURE", message: error.message })
      })
  }
}

export const doUpdateLoginData = value => {
  return (dispatch, getState) => {
    const state = getState()
    axios({
      method: "POST",
      url: host + "/users/update/" + value.id,
      data: value,
      headers: {
        Authorization: "token " + state.ofc.login.token
      }
    })
      .then(response => {
        if (response.data.status === "ok") {
          console.log("do update login data", response.data.user.photo, state.ofc.login.photo)
          dispatch({ type: "UPDATE_LOGIN_DATA", data: response.data.user })
        }
      })
      .catch(console.log)
  }
}

export const doReceiveNotification = (notification, onlyId) => ({
  type: "NOTIFICATION",
  notification: notification,
  onlyId: onlyId
})

export const setExpoToken = expoToken => ({
  type: "EXPO_TOKEN",
  expoToken
})

export const setOpacity = opacity => ({
  type: "OPACITY",
  opacity
})

export const getTemplates = callback => {
  return (dispatch, getState) => {
    dispatch({ type: "ADMIN_IN_PROGRESS" })
    const state = getState()
    axios({
      method: "GET",
      url: host + "/templates",
      headers: {
        Authorization: "token " + state.ofc.login.token
      }
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({
            type: "TEMPLATES_LIST",
            templates: response.data.templates
          })
          if (callback) callback(null, response.data.message)
        } else dispatch({ type: "TEMPLATES_LIST", templates: [] })
      })
      .catch(error => {
        dispatch({ type: "TEMPLATES_LIST", templates: [] })
        if (callback) callback(error)
      })
  }
}

export const doAddTemplate = (value, callback) => {
  return (dispatch, getState) => {
    dispatch({ type: "ADMIN_IN_PROGRESS" })
    const state = getState()
    axios({
      method: "POST",
      url: host + "/templates",
      headers: {
        Authorization: "token " + state.ofc.login.token
      },
      data: value
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "TEMPLATES_LIST" })
          if (callback) callback(null, response.data.message)
          getTemplates()(dispatch, getState)
        } else dispatch({ type: "TEMPLATES_LIST" })
      })
      .catch(error => {
        dispatch({ type: "TEMPLATES_LIST" })
        if (callback) callback(error)
      })
  }
}

export const doUpdateTemplate = (value, callback) => {
  return (dispatch, getState) => {
    dispatch({ type: "ADMIN_IN_PROGRESS" })
    const state = getState()
    axios({
      method: "PUT",
      url: host + "/templates/update/" + value._id,
      headers: {
        Authorization: "token " + state.ofc.login.token
      },
      data: value
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "TEMPLATES_LIST" })
          if (callback) callback(null, response.data.message)
          getTemplates()(dispatch, getState)
        } else dispatch({ type: "TEMPLATES_LIST" })
      })
      .catch(error => {
        dispatch({ type: "TEMPLATES_LIST" })
        if (callback) callback(error)
      })
  }
}

export const getServerConfig = callback => {
  return (dispatch, getState) => {
    dispatch({ type: "ADMIN_IN_PROGRESS" })
    const state = getState()
    axios({
      method: "GET",
      url: host + "/config",
      headers: {
        Authorization: "token " + state.ofc.login.token
      }
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "ADMIN_CONFIG", config: response.data.config })
          if (callback) callback(null, response.data.message)
        } else dispatch({ type: "ADMIN_CONFIG", config: {} })
      })
      .catch(error => {
        dispatch({ type: "ADMIN_CONFIG", config: {} })
        if (callback) callback(error)
      })
  }
}

export const doUpdateServerConfig = (value, callback) => {
  return (dispatch, getState) => {
    dispatch({ type: "ADMIN_IN_PROGRESS" })
    const state = getState()
    axios({
      method: "PUT",
      url: host + "/config",
      headers: {
        Authorization: "token " + state.ofc.login.token
      },
      data: value
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "ADMIN_CONFIG", config: response.data.config })
          if (callback) callback(null, response.data.message)
        } else dispatch({ type: "ADMIN_CONFIG" })
      })
      .catch(error => {
        dispatch({ type: "ADMIN_CONFIG" })
        if (callback) callback(error)
      })
  }
}

export const doResetPassword = (value, callback) => {
  return (dispatch, getState) => {
    axios({
      method: "POST",
      url: host + "/auth/resetpassword",
      data: value
    })
      .then(response => {
        if (response.data.status === "ok") {
          if (callback) callback(null, response.data.message)
        } else if (callback) callback(response.data.message)
      })
      .catch(error => {
        console.log(error.message)
        if (callback) callback(error.message)
      })
  }
}

export const doChangePassword = (value, callback) => {
  return (dispatch, getState) => {
    const state = getState()
    axios({
      method: "POST",
      url: host + "/auth/changepassword",
      headers: {
        Authorization: "token " + state.ofc.login.token
      },
      data: { ...value, _id: state.ofc.login.id }
    })
      .then(response => {
        if (response.data.status === "ok") {
          if (callback) callback(null, response.data.message)
        } else if (response.data.status === "error") if (callback) callback(response.data.message)
      })
      .catch(error => {
        if (callback) callback(error.message)
      })
  }
}

export const initializeOfc = () => ({
  type: "OFC_INITIALIZE"
})

export const getLocations = callback => {
  return (dispatch, getState) => {
    const state = getState()
    axios({
      method: "GET",
      url: host + "/checkins/locations",
      headers: {
        Authorization: "token " + state.ofc.login.token
      }
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "LOCATIONS", locations: response.data.locations })
          if (callback) callback(null, response.data.locations)
        } else if (response.data.status === "error") if (callback) callback(response.data.message)
      })
      .catch(error => {
        if (callback) callback(error.message)
      })
  }
}

export const setLocation = location => ({
  type: "SET_LOCATION",
  location
})

export const setDirection = direction => ({
  type: "SET_DIRECTION",
  direction
})

export const commitCheckin = (params, callback) => {
  return (dispatch, getState) => {
    const state = getState()
    // If this is already committed
    var ci = state.ofc.ofc.checkins.find(item => item.barcode === params.barcode)
    if (!ci) {
      let err = "Barcode " + params.barcode + " is not present. Checkin Failed"
      if (callback) callback(err)
      return
    }
    if (
      state.ofc.ofc.commits.findIndex(
        item => item.barcode === params.barcode && item.location === params.location && item.direction === params.direction
      ) < 0
    ) {
      // if it is not, add to commits
      dispatch({ type: "COMMIT_CHECKIN", params: params })
      dispatch({ type: "INCREMENT_DEVICE_CHECKIN" })
    }
    if (callback) callback(null, ci)
  }
}

export const syncCommits = () => {
  return (dispatch, getState) => {
    const state = getState()

    if (moment().diff(moment(state.ofc.ofc.lastCommitError)) < 60000) return

    state.ofc.ofc.commits.forEach(item => {
      if (!(item.location && item.direction && item.barcode)) {
        dispatch({ ...item, type: "COMMIT_REMOVE" })
        return
      }
      setBarcode(item, (err, row) => {
        if (err) {
          if (err.match(/No valid barcode/)) dispatch({ ...item, type: "COMMIT_REMOVE" })
          else dispatch({ type: "COMMIT_ERROR" })
        } else dispatch({ ...item, type: "COMMIT_REMOVE" })
      })(dispatch, getState)
    })
  }
}

export const setBarcode = (params, callback) => {
  return (dispatch, getState) => {
    const state = getState()
    axios({
      method: "PUT",
      url: host + "/checkins/checkin/" + params.barcode,
      headers: {
        Authorization: "token " + state.ofc.login.token
      },
      data: { location: params.location, direction: params.direction, date: params.date }
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "SET_CHECKIN", checkin: { ...response.data.checkin, barcode: params.barcode } })
          if (callback) callback(null, { ...response.data.checkin, barcode: params.barcode })
        } else if (response.data.status === "error") if (callback) callback(response.data.message)
      })
      .catch(error => {
        if (callback) callback(error.message)
      })
  }
}

export const getCheckins = (params, callback) => {
  return (dispatch, getState) => {
    const state = getState()
    axios({
      method: "GET",
      url: host + "/checkins/query/all",
      headers: {
        Authorization: "token " + state.ofc.login.token
      }
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "SET_CHECKINS", checkins: response.data.checkins })
          if (callback) callback(null, response.data.checkins)
        } else if (response.data.status === "error") if (callback) callback(response.data.message)
      })
      .catch(error => {
        if (callback) callback(error.message)
      })
  }
}

export const searchCheckins = (params, callback) => {
  return (dispatch, getState) => {
    params.query = params.query || "all"
    const state = getState()
    axios({
      method: "GET",
      url: host + "/checkins/query/" + params.query,
      headers: {
        Authorization: "token " + state.ofc.login.token
      },
      params: { checkinDate: params.date },
      data: { checkinDate: params.date }
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "CHECKINS_SEARCH", searchOutput: response.data.checkins })
          if (callback) callback(null, response.data.checkins)
        } else if (response.data.status === "error") if (callback) callback(response.data.message)
      })
      .catch(error => {
        if (callback) callback(error.message)
      })
  }
}

export const summaryCheckins = (params, callback) => {
  return (dispatch, getState) => {
    const state = getState()
    axios({
      method: "GET",
      url: host + "/checkins/summary",
      headers: {
        Authorization: "token " + state.ofc.login.token
      },
      params: { checkinDate: params.date },
      data: { checkinDate: params.date }
    })
      .then(response => {
        if (response.data.status === "ok") {
          dispatch({ type: "CHECKINS_SUMMARY", summary: response.data.summary })
          if (callback) callback(null, response.data.summary)
        } else if (response.data.status === "error") if (callback) callback(response.data.message)
      })
      .catch(error => {
        if (callback) callback(error.message)
      })
  }
}

export const updatePiIP = ip => ({
  type: "PI_IP",
  ip: ip
})

export const newVersion = (value, revisionId) => ({
  type: "NEW_VERSION",
  value: value,
  revisionId: revisionId
})
