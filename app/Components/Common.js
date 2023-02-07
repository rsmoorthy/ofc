import React, { Component } from "react"
import { StyleSheet, ActivityIndicator, View, Animated } from "react-native"
import { Button, Text } from "native-base"
import moment from "moment"

export const Spinner = props => (
  <View style={styles.loading} pointerEvents="none">
    <View style={styles.loading_view}>
      <ActivityIndicator size="large" color="#000000" />
    </View>
  </View>
)

export const StatusButton = props => {
  let buttonBackgroundColor = props.status === "ok" ? "green" : props.status === "error" ? "red" : "white"
  let textColor = props.status === "ok" ? "white" : props.status === "error" ? "white" : "blue"
  return (
    <Button
      onPress={props.onPress}
      style={[
        styles.statusButton,
        props.size === "large" ? styles.statusButtonLarge : styles.statusButtonNormal,
        props.style,
        { backgroundColor: buttonBackgroundColor }
      ]}
    >
      <Text style={{ alignSelf: "center", color: textColor }}>{props.buttonText}</Text>
    </Button>
  )
}

export class Blink extends Component {
  state = {
    duration: 2000,
    show: 1,
    fadeAnim: new Animated.Value(this.props.visible === "blink" ? 0.2 : 1)
  }

  componentWillMount() {
    this.timer = setInterval(() => {
      let oldshow = this.state.show
      let newshow = this.state.show ? 0 : 1
      let visible = this.props.visible ? this.props.visible : "blink"
      if (visible !== "blink") {
        this.setState({ show: this.state.show ? 0 : 1, fadeAnim: new Animated.Value(1) })
        return
      }
      this.setState({ show: this.state.show ? 0 : 1 })
      Animated.timing(
        // Animate over time
        this.state.fadeAnim, // The animated value to drive
        {
          toValue: newshow === 1 ? 0.9 : 0.2, // Animate to opacity: 1 (opaque)
          duration: this.state.duration - 100 // Make it take a while
        }
      ).start()
    }, this.state.duration)
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer)
  }

  render() {
    return <Animated.View style={{ ...this.props.style, opacity: this.state.fadeAnim }}>{this.props.children}</Animated.View>
  }
}

var randomStore = {}
export const getRandomValue = props => {
  if (!props.name || !props.type || !props.cycle) return
  if (!randomStore[props.name]) randomStore[props.name] = { name: props.name, cycle: props.cycle, type: props.type, lastChanged: 0 }
  let r = randomStore[props.name]
  if (moment().diff(r.lastChanged) > props.cycle) {
    r.lastChanged = moment()
    if (props.type === "boolean") {
      r["value"] = Math.random() > 0.5
      return r["value"]
    }
    if (props.type === "range") {
    }
  }
  return r["value"]
}

const styles = StyleSheet.create({
  loading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5FCFF88"
  },
  loading_view: {
    width: "60%",
    borderColor: "gray",
    borderWidth: 0.5,
    backgroundColor: "#ffffff",
    borderRadius: 5,
    paddingTop: 10,
    paddingBottom: 10
  },
  statusButton: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "white",
    borderColor: "gray",
    borderWidth: 3,
    borderRadius: 5
  },
  statusButtonLarge: {
    height: 75,
    width: 300
  },
  statusButtonNormal: {
    height: 50,
    width: 300
  }
})
