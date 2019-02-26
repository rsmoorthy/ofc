import React, { Component } from "react"
import {
  View,
  Text,
  Image,
  StyleSheet,
  Button,
  ActivityIndicator,
  TouchableHighlight,
  TouchableOpacity,
  StatusBar,
  Alert
} from "react-native"
import { Icon, Toast } from "native-base"

import t from "tcomb-form-native" // 0.6.9
import { connect } from "react-redux"
import * as utils from "../utils"
import Expo from "expo"
import config from "../config"

const Form = t.form.Form
const LoginForm = t.struct({
  email: t.String,
  password: t.String
})

const myStyles = {
  ...utils.materialFormStyles,
  textbox: {
    normal: { color: "white" }
  }
}

const loginFormOptions = {
  auto: "placeholders",
  fields: {
    email: {
      placeholder: "Email / Mobile",
      error: "Specify a registered email or mobile",
      autoCapitalize: "none"
    },
    password: {
      secureTextEntry: true,
      error: "Specify password",
      autoCapitalize: "none"
    }
  },
  stylesheet: myStyles
  // stylesheet: Form.stylesheet // utils.formStyles
}

class Login extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: {
        email: "",
        password: ""
      }
    }
  }

  static navigationOptions = {
    tabBarIcon: ({ tintColor }) => <Icon name="ios-log-in" style={{ color: tintColor }} />
  }

  handleGoogleSignin = async () => {
    let err
    const result = await Expo.Google.logInAsync({
      behavior: "system",
      androidClientId: config.google.androidClientId,
      androidStandaloneAppClientId: config.google.androidStandaloneAppClientId,
      scopes: ["profile", "email"]
    }).catch(e => {
      err = e.message
    })

    if (err)
      return this.props.dispatch({
        type: "LOGIN_FAILURE",
        message: "Google Signin Error: ",
        err
      })

    console.log("google signin", result.type, result.accessToken, result)
    if (result.type === "success") {
      this.props.doGoogleSignin(
        {
          name: result.user.name,
          email: result.user.email,
          photo: result.user.photoUrl,
          accessToken: result.accessToken
        },
        (err, resp) => {
          if (err) Alert.alert("Failed to Google Signin: " + err)
          if (resp.signup)
            this.props.navigation.navigate("GoogleSignup", {
              value: { ...resp.value }
            })
        }
      )
    }
  }

  handleSubmit = () => {
    const value = this._form.getValue()
    if (value) {
      this.state.value = value
      this.props.doLogin(value)
    }
  }

  render() {
    return (
      <View style={styles.container}>
        <StatusBar hidden={true} barStyle="dark-content" />
        {/* <Text style={{ fontFamily: 'serif', fontSize: 32, color: 'white' }}>IshaPi</Text> */}
        <Image
          style={{
            alignSelf: "stretch",
            flex: 0.2,
            height: undefined,
            width: undefined
          }}
          source={require("../assets/icon.png")}
          resizeMode="contain"
        />
        <View style={{ marginTop: 50, width: "80%" }}>
          <Form ref={c => (this._form = c)} type={LoginForm} value={this.state.value} options={loginFormOptions} />
          <Button title="Login" onPress={this.handleSubmit} />
        </View>
        {this.props.login.error !== "" && <Text style={{ fontSize: 22, color: "red" }}>{this.props.login.error}</Text>}
        {this.props.login.inProgress === true && <ActivityIndicator size="large" color="#ffffff" />}
        <View
          style={{
            flexDirection: "row",
            marginTop: 50,
            marginBottom: 20,
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <Button
            style={{ flex: 0.3, marginRight: 50 }}
            title="   Sign Up    "
            onPress={() => this.props.navigation.navigate("Signup")}
          />
          <Text style={{ flex: 0.2 }}> </Text>
          <TouchableHighlight style={{ flex: 0.5, padding: 0 }} onPress={this.handleGoogleSignin}>
            <Image style={{ flex: 1, width: 160 }} source={require("../assets/signin_with_google.png")} />
          </TouchableHighlight>
        </View>
        <TouchableHighlight
          style={{
            flex: 0.1,
            padding: 0,
            marginBottom: 1,
            alignItems: "center",
            justifyContent: "center"
          }}
          onPress={() => this.props.navigation.push("ForgotPasswordModal")}
        >
          <View style={{ height: 30, padding: 5, backgroundColor: "#2296f3" }}>
            <Text
              style={{
                flex: 1,
                fontSize: 12,
                color: "white",
                fontWeight: "bold"
              }}
            >
              Forgot Password
            </Text>
          </View>
        </TouchableHighlight>
        <View style={{ height: 180 }}>
          <Text> </Text>
        </View>
        <View style={{ alignSelf: "center" }}>
          <Text style={{ color: "white", fontSize: 12 }}>{utils.appVersion}</Text>
        </View>
      </View>
    )
  }
}
export default connect(
  utils.mapStateToProps("ofc", ["login"]),
  utils.mapDispatchToProps
)(Login)

class _ForgotPasswordModal extends Component {
  static navigationOptions = {
    header: null
  }

  getType = () => {
    return t.struct({
      email: t.maybe(utils.tform.Email),
      mobile: t.maybe(t.Number)
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      inProgress: false,
      type: this.getType(),
      value: {
        email: "",
        mobile: ""
      },
      options: {
        fields: {
          email: {
            error: "Require a valid email address?",
            autoCapitalize: "none",
            keyboardType: "email-address"
          },
          mobile: {
            keyboardType: "numeric"
          }
        },
        stylesheet: utils.formStyles
      }
    }
  }

  handleSubmit = () => {
    const value = this._form.getValue()
    if (value) {
      this.state.value = value
      if (value.email || value.mobile) {
        this.setState({ inProgress: true })
        this.props.doResetPassword(value, (err, message) => {
          this.setState({ inProgress: false })
          if (err) Alert.alert("Invalid email / mobile", err)
          else {
            Toast.show({
              text: "Your password reset and sent to your email/mobile",
              buttonText: "Ok",
              type: "success",
              duration: 4000
            })
            this.props.navigation.goBack()
          }
        })
      } else
        Toast.show({
          text: "Specify either email or mobile",
          type: "danger",
          position: "top",
          duration: 3000
        })
    }
  }

  componentDidMount() {
    this.props.setOpacity(0.1)
  }

  componentWillUnmount() {
    this.props.setOpacity(1.0)
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            backgroundColor: "white",
            borderColor: "gray",
            width: "80%",
            borderRadius: 8,
            borderWidth: 1
          }}
        >
          <Icon name="close-circle" style={{ alignSelf: "flex-end" }} onPress={() => this.props.navigation.goBack()} />
          {this.state.inProgress === true && <ActivityIndicator size="large" color="#000" />}
          <View style={{ padding: 20, width: "100%", alignSelf: "stretch" }}>
            <Form
              ref={c => (this._form = c)}
              type={this.state.type}
              value={this.state.value}
              options={this.state.options}
            />
          </View>
          <Button
            info
            disabled={this.state.inProgress}
            block
            title="Reset Password"
            style={{ width: "100%" }}
            onPress={this.handleSubmit}
          >
            <Text> Reset Password </Text>
          </Button>
        </View>
      </View>
    )
  }
}

export const ForgotPasswordModal = connect(
  utils.mapStateToProps("ofc", ["login", "meta"]),
  utils.mapDispatchToProps
)(_ForgotPasswordModal)

class _ChangePasswordModal extends Component {
  static navigationOptions = {
    header: null
  }

  getType = () => {
    return t.struct({
      old_password: t.String,
      password: t.String
    })
  }

  constructor(props) {
    super(props)
    this.state = {
      inProgress: false,
      type: this.getType(),
      value: {
        old_password: "",
        password: ""
      },
      options: {
        fields: {
          old_password: {
            secureTextEntry: true,
            autoCapitalize: "none"
          },
          password: {
            secureTextEntry: true,
            autoCapitalize: "none"
          }
        },
        stylesheet: utils.formStyles
      }
    }
  }

  handleSubmit = () => {
    const value = this._form.getValue()
    if (value) {
      this.state.value = value
      if (value.old_password && value.password) {
        this.setState({ inProgress: true })
        this.props.doChangePassword(value, (err, message) => {
          this.setState({ inProgress: false })
          if (err) Alert.alert("ERROR: ", err)
          else {
            Toast.show({
              text: "Your password has been changed successfully",
              buttonText: "Ok",
              type: "success",
              duration: 6000
            })
            this.props.navigation.goBack()
          }
        })
      }
    }
  }

  componentDidMount() {
    this.props.setOpacity(0.1)
  }

  componentWillUnmount() {
    this.props.setOpacity(1.0)
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            backgroundColor: "white",
            borderColor: "gray",
            width: "80%",
            borderRadius: 8,
            borderWidth: 1
          }}
        >
          <Icon name="close-circle" style={{ alignSelf: "flex-end" }} onPress={() => this.props.navigation.goBack()} />
          {this.state.inProgress === true && <ActivityIndicator size="large" color="#000" />}
          <View style={{ padding: 20, width: "100%", alignSelf: "stretch" }}>
            <Form
              ref={c => (this._form = c)}
              type={this.state.type}
              value={this.state.value}
              options={this.state.options}
            />
          </View>
          <Button
            info
            disabled={this.state.inProgress}
            block
            title="Change Password"
            style={{ width: "100%" }}
            onPress={this.handleSubmit}
          >
            <Text> Change Password </Text>
          </Button>
        </View>
      </View>
    )
  }
}

export const ChangePasswordModal = connect(
  utils.mapStateToProps("ofc", ["login", "meta"]),
  utils.mapDispatchToProps
)(_ChangePasswordModal)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#437FC4",
    alignItems: "center",
    justifyContent: "center"
  }
})
