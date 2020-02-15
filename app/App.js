import React from "react"
import { Provider } from "react-redux"
import { StyleSheet, Text, View, YellowBox, AppState } from "react-native"
import { createStackNavigator } from "react-navigation"
import MainScreen from "./Components/MainScreen"
import { AppLoading, Expo, Notifications, Updates } from "expo";
import * as Font from 'expo-font';
import NavigatorService from "./services/navigator"
import { PersistGate } from "redux-persist/integration/react"

import { store, persistor } from "./store"
import { Toast } from "native-base"

export default class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      appState: null,
      lastCheck: new Date()
    }
  }

  handleAppState = async nextAppState => {
    console.log("App changed state", nextAppState)
    this.setState({ appState: nextAppState })
    if (new Date() - this.state.lastCheck < 60 * 1000) return
    console.log("checking for new version")
    let resp = await Updates.checkForUpdateAsync().catch(err => console.log("chek for new version failed", err.message))
    this.setState({ lastCheck: new Date() })
    if (resp && resp.isAvailable) {
      if (store.getState().ofc.meta.revisionId === resp.manifest.revisionId)
        return console.log("New version already downloaded", resp.manifest.revisionId)
      console.log("New version available", resp.manifest.revisionId, store.getState().ofc.meta.revisionId)
      let out = await Updates.fetchUpdateAsync().catch(err => console.log("fetch new version failed", err.message))
      if (out && out.isNew) {
        this.setState({ updatesAvailable: true })
        console.log("New version downloaded", out.isNew)
        store.dispatch({
          type: "NEW_VERSION",
          value: true,
          revisionId: resp.manifest.revisionId
        })
        if (this.state.appState === "active")
          Toast.show({
            text: "A new version of App is available. Reload to activate",
            buttonText: "Ok",
            type: "success",
            duration: 30000
          })
        // Updates.reloadFromCache()
      }
    } else {
      console.log("no new version available")
      store.dispatch({ type: "NEW_VERSION", value: false })
    }
  }

  async componentWillMount() {
    await Font.loadAsync({
      Roboto: require("native-base/Fonts/Roboto.ttf"),
      Roboto_medium: require("native-base/Fonts/Roboto_medium.ttf"),
      arial: require("./assets/fonts/arial.ttf"),
      arial_bold: require("./assets/fonts/arialbd.ttf"),
      arial_bold_italic: require("./assets/fonts/arialbi.ttf"),
      arial_italic: require("./assets/fonts/ariali.ttf"),
      georgia: require("./assets/fonts/georgia.ttf"),
      georgia_bold: require("./assets/fonts/georgiab.ttf"),
      georgia_itlaic: require("./assets/fonts/georgiai.ttf")
    })
    AppState.addEventListener("change", this.handleAppState)
    this.setState({ loading: false })
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this.handleAppState)
  }

  render() {
    if (this.state.loading) {
      return (
        <Provider store={store}>
          <AppLoading />
        </Provider>
      )
    }
    return (
      <Provider store={store}>
        <PersistGate loading={<AppLoading />} persistor={persistor}>
          <MainScreen />
        </PersistGate>
      </Provider>
    )
  }
}

const AppStackNavigator = createStackNavigator({
  Main: {
    screen: MainScreen
  }
})

console.disableYellowBox = true
YellowBox.ignoreWarnings(["Warning: isMounted(...) is deprecated", "Module RCTImageLoader"])

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
})
