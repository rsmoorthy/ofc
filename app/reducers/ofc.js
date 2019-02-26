import R from "ramda"
import moment from "moment"
const initialState = {
  users: [],
  notifications: [],
  smsTemplates: [],
  emailTemplates: [],
  notificationTemplates: [],
  signup: {
    id: "",
    inProgress: false,
    needAuthCode: false,
    successMessage: "",
    errorMessage: ""
  },
  expoToken: "",
  ofc: {
    lastObtained: 0,
    locations: [],
    location: "",
    direction: "",
    commits: [],
    checkins: [],
    deviceCheckins: 0,
    lastCommitError: 0,
    searchOutput: [],
    summary: {}
  },
  login: {
    inProgress: false,
    token: "",
    id: "",
    name: "",
    email: "",
    mobile: "",
    role: "",
    error: "",
    photo: "",
    group: "",
    lastSeen: null
  },
  meta: {
    newVersion: false,
    lastNotificationId: null,
    screenOpacity: 1,
    adminInProgress: false,
    userListInProgress: false,
    inProgress: false,
    updateUserError: "",
    updateUserSuccess: ""
  },
  config: {},
  text: "",
  apps: [],
  dummyData: {}
}

const updateRecordById = (records, row, id) => {
  let idx = records.findIndex(obj => obj[id] === row[id])
  if (idx >= 0) {
    return [...records.slice(0, idx), row, ...records.slice(idx + 1)]
  } else {
    return [...records, row]
  }
}

const getUserListByRole = (role = "User", users) => {
  return R.pipe(
    R.filter(user => user.role === role),
    R.reduce((acc, user) => {
      acc[user._id] = user.name
      return acc
    }, {})
  )(users)
}

export default (state = initialState, action) => {
  switch (action.type) {
    case "OPACITY":
      return {
        ...state,
        meta: {
          ...state.meta,
          screenOpacity: action.opacity
        }
      }

    case "USER_LIST":
      return {
        ...state,
        users: action.users,
        meta: {
          ...state.meta,
          userListInProgress: false
        }
      }

    case "USER_LIST_IN_PROGRESS":
      return {
        ...state,
        meta: {
          ...state.meta,
          userListInProgress: true
        }
      }

    case "SIGNUP_IN_PROGRESS":
      return {
        ...state,
        signup: {
          ...state.signup,
          inProgress: true,
          successMessage: "",
          errorMessage: ""
        }
      }

    case "SIGNUP_VERIFY":
      return {
        ...state,
        signup: {
          id: action.id,
          needAuthCode: true,
          inProgress: false,
          successMessage: "",
          errorMessage: ""
        }
      }

    case "SIGNUP_SUCCESS":
      return {
        ...state,
        signup: {
          id: "",
          needAuthCode: false,
          inProgress: false,
          successMessage: "Signup Successful!",
          errorMessage: ""
        }
      }

    case "SIGNUP_FAILURE":
      return {
        ...state,
        signup: {
          id: action.verify ? state.signup.id : "",
          needAuthCode: action.verify === true,
          inProgress: false,
          successMessage: "",
          errorMessage: action.message
        }
      }

    case "SIGNUP_RESET":
      return {
        ...state,
        signup: {
          id: "",
          needAuthCode: false,
          inProgress: false,
          successMessage: "",
          errorMessage: ""
        }
      }

    case "LOGIN_IN_PROGRESS":
      return {
        ...state,
        login: {
          ...state.login,
          inProgress: true,
          error: ""
        }
      }

    case "LOGIN_SUCCESS":
      return {
        ...state,
        login: {
          inProgress: false,
          token: action.value.token ? action.value.token : action.value.id,
          id: action.value.id,
          name: action.value.name,
          email: action.value.email,
          mobile: action.value.mobile,
          role: action.value.role,
          photo: action.value.photo,
          group: action.value.group,
          lastSeen: action.value.lastSeen,
          error: ""
        },
        locations: action.value.locations
      }

    case "LOGIN_FAILURE":
    case "LOGOUT":
      return {
        ...state,
        login: {
          inProgress: false,
          token: "",
          id: "",
          name: "",
          email: "",
          mobile: "",
          role: "",
          photo: "",
          group: "",
          error: action.type === "LOGIN_FAILURE" ? action.message : ""
        },
        pi: {
          ...state.pi,
          client_cert: "",
          client_key: "",
          ssh_key: "",
          key1: "",
          key2: "",
          key3: "",
          key4: "",
          key5: "",
          key6: "",
          publicKey1: "",
          publicKey2: "",
          publicKey3: "",
          publicKey4: "",
          publicKey5: "",
          publicKey6: "",
          lastObtained: ""
        },
        users: []
      }

    case "UPDATE_LOGIN_DATA":
      return {
        ...state,
        login: {
          ...state.login,
          photo: action.data.photo
        }
      }

    case "UPDATE_USER_SUCCESS":
    case "UPDATE_USER_FAILURE":
    case "UPDATE_USER_RESET":
      return {
        ...state,
        meta: {
          ...state.meta,
          updateUserSuccess: action.type === "UPDATE_USER_SUCCESS" ? "Updated Successfully" : "",
          updateUserError: action.type === "UPDATE_USER_FAILURE" ? action.message : ""
        }
      }

    case "NOTIFICATION":
      return {
        ...state,
        notifications: action.onlyId ? state.notifications : updateRecordById(state.notifications, action.notification, "notificationId"),
        meta: {
          ...state.meta,
          lastNotificationId: action.notification.notificationId
        }
      }

    case "EXPO_TOKEN":
      return {
        ...state,
        expoToken: action.expoToken
      }

    case "ADMIN_IN_PROGRESS":
      var cfg = state.config || {}
      return {
        ...state,
        meta: {
          ...state.meta,
          adminInProgress: true
        },
        config: cfg
      }

    case "TEMPLATES_LIST":
      return {
        ...state,
        smsTemplates: action.templates ? R.filter(item => item.type === "SMS", action.templates) : state.smsTemplates,
        emailTemplates: action.templates ? R.filter(item => item.type === "Email", action.templates) : state.emailTemplates,
        notificationTemplates: action.templates
          ? R.filter(item => item.type === "Notification", action.templates)
          : state.notificationTemplates,
        meta: {
          ...state.meta,
          adminInProgress: false
        }
      }

    case "ADMIN_CONFIG":
      return {
        ...state,
        config: action.config ? action.config : state.config ? state.config : {},
        meta: {
          ...state.meta,
          adminInProgress: false
        }
      }

    case "NEW_VERSION":
      return {
        ...state,
        meta: {
          ...state.meta,
          newVersion: action.value,
          revisionId: action.revisionId ? action.revisionId : state.meta.revisionId
        }
      }

    case "OFC_INITIALIZE":
      return {
        ...state,
        ofc: {
          ...state.ofc,
          deviceCheckins: state.ofc.deviceCheckins === undefined ? 0 : state.ofc.deviceCheckins,
          commits: state.ofc.commits ? (state.ofc.commits === 1 ? [] : state.ofc.commits) : [],
          searchOutput: state.ofc.searchOutput ? state.ofc.searchOutput : [],
          summary: state.ofc.summary ? state.ofc.summary : {},
          lastCommitError: state.ofc.lastCommitError ? state.ofc.lastCommitError : 0
        }
      }

    case "LOCATIONS":
      return {
        ...state,
        ofc: {
          ...state.ofc,
          locations: action.locations ? action.locations : [],
          location: state.ofc.location ? state.ofc.location : action.locations[0]
        }
      }

    case "SET_LOCATION":
      return {
        ...state,
        ofc: {
          ...state.ofc,
          location: action.location ? action.location : ""
        }
      }

    case "SET_DIRECTION":
      return {
        ...state,
        ofc: {
          ...state.ofc,
          direction: action.direction ? action.direction : ""
        }
      }

    case "SET_CHECKINS":
      return {
        ...state,
        ofc: {
          ...state.ofc,
          checkins: action.checkins
        }
      }

    case "SET_CHECKIN":
      let idx = state.ofc.checkins.findIndex(item => item.barcode === action.checkin.barcode)
      if (!(idx >= 0)) return state
      return {
        ...state,
        ofc: {
          ...state.ofc,
          checkins: [...state.ofc.checkins.slice(0, idx), action.checkin, ...state.ofc.checkins.slice(idx + 1)]
        }
      }

    case "INCREMENT_DEVICE_CHECKIN":
      return {
        ...state,
        ofc: {
          ...state.ofc,
          deviceCheckins: state.ofc.deviceCheckins ? state.ofc.deviceCheckins + 1 : 1
        }
      }

    case "COMMIT_CHECKIN":
      return {
        ...state,
        ofc: {
          ...state.ofc,
          commits: [...state.ofc.commits, action.params]
        }
      }

    case "COMMIT_REMOVE":
      var idx = state.ofc.commits.findIndex(item => item.barcode === action.barcode)
      if (idx < 0) return state
      return {
        ...state,
        ofc: {
          ...state.ofc,
          commits: [...state.ofc.commits.slice(0, idx), ...state.ofc.commits.slice(idx + 1)]
        }
      }

    case "COMMIT_ERROR":
      return {
        ...state,
        ofc: {
          ...state.ofc,
          lastCommitError: moment()
        }
      }

    case "CHECKINS_SEARCH":
      return {
        ...state,
        ofc: {
          ...state.ofc,
          searchOutput: action.searchOutput
        }
      }

    case "CHECKINS_SUMMARY":
      return {
        ...state,
        ofc: {
          ...state.ofc,
          summary: action.summary
        }
      }

    default:
      return state
  }
}
