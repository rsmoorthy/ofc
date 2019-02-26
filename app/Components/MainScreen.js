import React, { Component } from "react"
import { View, ScrollView, Image, StyleSheet, Platform, ActivityIndicator, StatusBar, Dimensions, YellowBox } from "react-native"

import Login, { ForgotPasswordModal, ChangePasswordModal } from "./Login"
import UserHome from "./UserHome"
import ListUsers from "./ListUsers"
import Summary from "./Summary"
import { UserList } from "./UserList"
import UserForm from "./UserForm"
import Profile from "./Profile"
import Signup, { GoogleSignup } from "./Signup"
import AdminScreen, { AdminTemplatesList, AdminTemplatesForm, ConfigItemForm } from "./AdminScreen"
import ModalScreen, { FeedbackModal } from "./ModalScreen"
import GetPhotoModal from "./GetPhotoModal"
import { connect } from "react-redux"
import * as utils from "../utils"
import registerForPushNotifications from "../services/notifications"

import {
  DrawerItems,
  DrawerActions,
  SafeAreaView,
  TabNavigator,
  createAppContainer,
  createStackNavigator,
  createDrawerNavigator,
  createBottomTabNavigator,
  createSwitchNavigator
} from "react-navigation"
import { Icon, Button, Text, Root } from "native-base"
import { Font, AppLoading, Expo, ScreenOrientation, Notifications, Updates } from "expo"
import NavigatorService from "../services/navigator"

ScreenOrientation.allowAsync(ScreenOrientation.Orientation.ALL)
YellowBox.ignoreWarnings(["Warning: isMounted(...) is deprecated", "Module RCTImageLoader"])

const navigationOptions = {
  animationEnabled: true,
  swipeEnabled: true,
  tabBarPosition: "bottom",
  tabBarOptions: {
    style: {
      ...Platform.select({
        android: {
          backgroundColor: "white"
        }
      })
    },
    activeTintColor: "#55acee",
    inactiveTintColor: "#000000", // '#d1cece',
    showLabel: false,
    showIcon: true
  },
  // drawerBackgroundColor: '#0094d7',
  drawerWidth: 250,
  contentComponent: connect(
    utils.mapStateToProps("ofc", ["login", "meta"]),
    utils.mapDispatchToProps
  )(props => (
    <ScrollView>
      <View
        style={{
          flex: 1,
          height: 120,
          backgroundColor: "#0094d7",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Image
          style={{
            alignSelf: "stretch",
            flex: 0.5,
            height: undefined,
            width: undefined
          }}
          source={require("../assets/icon.png")}
          resizeMode="contain"
        />
      </View>
      {/* <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
        <Button transparent small danger onPress={() => props.navigation.dispatch(DrawerActions.closeDrawer())}>
          <Icon name="ios-close-circle" />
        </Button>
      </View> */}
      <DrawerItems {...props} />
      <Button small warning title="Logout" onPress={props.doLogout} style={{ marginBottom: 10 }}>
        <Icon name="ios-log-out" onPress={props.doLogout} />
        <Text>Logout</Text>
      </Button>
      <Text style={{ fontSize: 10, fontStyle: "italic" }}>
        {"     "} ver {utils.appVersion}
      </Text>
      {props.meta.newVersion && (
        <Button
          small
          transparent
          title="Reload App"
          onPress={() => {
            props.newVersion(false)
            setTimeout(() => Updates.reload(), 500)
          }}
          style={{ marginBottom: 10 }}
        >
          <Icon name="md-refresh" />
          <Text>Reload App</Text>
        </Button>
      )}
    </ScrollView>
  ))
}

function forVertical(props) {
  const { layout, position, scene } = props

  const index = scene.index
  const height = layout.initHeight

  const translateX = 0
  const translateY = position.interpolate({
    inputRange: ([index - 1, index, index + 1]: Array<number>),
    outputRange: ([height, 0, 0]: Array<number>)
  })

  return {
    transform: [{ translateX }, { translateY }]
  }
}

class MainScreen extends Component {
  onLayout(e) {
    var { height, width } = Dimensions.get("window")
    console.log("onlayout changed", height, width)
  }

  async componentDidMount() {
    Dimensions.addEventListener("change", this.onLayout.bind(this))
    let expoToken = await registerForPushNotifications().catch(err => console.log("expotoken", err.message))
    if (expoToken) {
      console.log("setting expo token", expoToken)
      this.props.setExpoToken(expoToken)
    }
    this._notificationSubscription = Notifications.addListener(this._handleNotification)
  }

  componentWillUnmount() {
    Dimensions.removeEventListener("change", this.onLayout.bind(this))
  }

  _handleNotification = notification => {
    notification.data.time = new Date()
    console.log("notification received", notification, this.props.meta.lastNotificationId, notification.notificationId)
    if (this.props.meta.lastNotificationId === notification.notificationId) return
    if (notification.data.type === "logout") {
      this.props.doLogout()
      this.props.doReceiveNotification({ notificationId: notification.notificationId }, true)
      Notifications.dismissNotificationAsync(notification.notificationId)
    }
  }

  // static navigationOptions = {

  //     headerLeft: <Icon name="ios-camera-outline" style={{ paddingLeft: 10 }} />,
  //     title: "Instagram",
  //     headerRight: <Icon style={{ paddingRight: 10 }} name="ios-send-outline" />
  // }
  static navigationOptions = {
    header: null
  }

  shouldComponentUpdate(nextProps, nextState) {
    if (nextProps.login.role === this.props.login.role) return false
    return true
  }

  render() {
    const adminUsersStack = createStackNavigator({ UserList, UserForm }, { initialRouteName: "UserList" })
    const adminScreensStack = createStackNavigator(
      {
        AdminScreen,
        AdminTemplatesList,
        AdminTemplatesForm,
        UserList,
        UserForm,
        ConfigItemForm
      },
      { initialRouteName: "AdminScreen" }
    )
    const authStack = createSwitchNavigator(
      {
        Login: Login,
        Signup: Signup,
        GoogleSignup: GoogleSignup
      },
      { initialRouteName: "Login" }
    )
    let userStack
    if (this.props.login.role === "User") {
      userStack = createDrawerNavigator(
        {
          Home: UserHome,
          List: ListUsers,
          Profile: Profile
        },
        navigationOptions
      )
    } else if (this.props.login.role === "None") {
      userStack = createDrawerNavigator(
        {
          Home: UserHome,
          Profile: Profile
        },
        navigationOptions
      )
    } else if (this.props.login.role === "Admin") {
      userStack = createDrawerNavigator(
        {
          Summary: Summary,
          List: ListUsers,
          Home: UserHome,
          Users: {
            screen: adminUsersStack,
            navigationOptions: {
              tabBarIcon: ({ tintColor }) => <Icon name="ios-people" style={{ color: tintColor }} />,
              drawerIcon: ({ tintColor }) => <Icon name="ios-people" style={{ color: tintColor }} />
            }
          },
          Profile: Profile,
          Admin: {
            screen: adminScreensStack,
            navigationOptions: {
              tabBarIcon: ({ tintColor }) => <Icon name="ios-apps" style={{ color: tintColor }} />,
              drawerIcon: ({ tintColor }) => <Icon name="ios-apps" style={{ color: tintColor }} />,
              header: null
            }
          }
        },
        navigationOptions
      )
    }

    const stack = {
      Auth: authStack
    }

    if (this.props.login.role !== "") stack.Main = userStack

    const MyAppNavigator = createSwitchNavigator(stack, {
      initialRouteName: this.props.login.role === "" ? "Auth" : "Main"
    })

    const RootNavigator = createStackNavigator(
      {
        Main: MyAppNavigator,
        Modal: ModalScreen,
        GetPhotoModal: GetPhotoModal,
        ForgotPasswordModal: ForgotPasswordModal,
        ChangePasswordModal: ChangePasswordModal
      },
      {
        mode: "modal",
        header: null,
        headerMode: "none",
        transitionConfig: () => ({ screenInterpolator: forVertical }),
        cardStyle: {
          opacity: 1,
          backgroundColor: "transparent"
        }
      }
    )
    const AppContainer = createAppContainer(RootNavigator)
    return (
      <Root>
        <AppContainer
          ref={nav => {
            NavigatorService.setContainer(nav, "within Root")
          }}
        />
      </Root>
    )
    /*
    return (
      <Root>
        <RootNavigator
          ref={nav => {
            NavigatorService.setContainer(nav, "within Root");
          }}
        />
      </Root>
    );
    */
  }
}

export default connect(
  utils.mapStateToProps("ofc", ["login", "meta"]),
  utils.mapDispatchToProps
)(MainScreen)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
})
