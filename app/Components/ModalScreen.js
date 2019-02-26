import React, { Component } from "react"
import { connect } from "react-redux"
import * as utils from "../utils"
import { View, StatusBar, StyleSheet, Alert, ActivityIndicator } from "react-native"
import moment from "moment"
import t from "tcomb-form-native" // 0.6.9
import StarRating from "react-native-star-rating"
import {
  Container,
  Content,
  Icon,
  Thumbnail,
  Header,
  Left,
  Title,
  Right,
  Body,
  List,
  ListItem,
  Button,
  Text,
  StyleProvider,
  Toast,
  Badge
} from "native-base"
import { getStatusBarHeight } from "react-native-status-bar-height"
// import getTheme from '../../native-base-theme/components'
// import material from '../../native-base-theme/variables/material'
// import platform from '../../native-base-theme/variables/platform'
import R from "ramda"
const Form = t.form.Form

class ModalScreen extends Component {
  componentDidMount() {
    this.props.setOpacity(0.1)
  }

  componentWillUnmount() {
    this.props.setOpacity(1.0)
  }

  render() {
    return (
      <View style={styles.container}>
        <View
          style={{
            backgroundColor: "white",
            borderColor: "red",
            borderWidth: 4
          }}
        >
          <Text>Hello Modal</Text>
        </View>
      </View>
    )
  }
}
export default connect(
  utils.mapStateToProps("ofc", ["meta"]),
  utils.mapDispatchToProps
)(ModalScreen)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
})
