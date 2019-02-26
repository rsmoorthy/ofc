import React, { Component } from "react"
import { connect } from "react-redux"
import * as utils from "../utils"
import { View, StatusBar, StyleSheet, TouchableOpacity, Platform, Image, Modal, TouchableHighlight } from "react-native"
import moment from "moment"
import { Constants, Camera, Permissions, ImagePicker, MapView, Marker, KeepAwake } from "expo"
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
  Badge
} from "native-base"
import { getStatusBarHeight } from "react-native-status-bar-height"
// import getTheme from '../../native-base-theme/components'
// import material from '../../native-base-theme/variables/material'
// import platform from '../../native-base-theme/variables/platform'

class GetPhotoModal extends Component {
  state = {
    id: null,
    image: null,
    permissionsGranted: false
  }

  async componentWillMount() {
    const id = this.props.navigation.getParam("id", null)
    const img = this.props.navigation.getParam("image", null)
    if (img) this.setState({ image: img })
    if (id) {
      const { status } = await Permissions.askAsync(Permissions.CAMERA)
      const { status2 } = await Permissions.askAsync(Permissions.CAMERA_ROLL)
      this.setState({ permissionsGranted: status === "granted" })
      this.setState({ id: id })
    }
  }

  componentDidMount() {
    this.props.setOpacity(0.4)
  }

  componentWillUnmount() {
    this.props.setOpacity(1.0)
  }

  imageUpdate = (id, result) => {
    if (result.cancelled) return
    this.setState({ image: result.uri })
    console.log("imageUpdate", id, this.props.login.id, result.uri)
    if (id === this.props.login.id) {
      console.log("updating login data")
      this.props.doUpdateLoginData({
        id: this.props.login.id,
        photo: "data:image/jpeg;base64," + result.base64
      })
    } else
      this.props.doUpdateUser({
        _id: id,
        id: id,
        photo: "data:image/jpeg;base64," + result.base64
      })
  }

  pickImage = async id => {
    let result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      quality: 0.9,
      base64: true,
      aspect: [1, 1]
    })

    this.imageUpdate(id, result)
  }

  openCamera = async id => {
    console.log("open camera", id)
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.5,
      base64: true,
      aspect: [1, 1]
    }).catch(err => console.log("opening camera failed", err.message))
    this.imageUpdate(id, result)
  }

  render() {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <View
          style={{
            backgroundColor: "white",
            borderColor: "gray",
            width: "70%",
            height: "50%",
            borderRadius: 8,
            borderWidth: 1
          }}
        >
          <Icon name="close-circle" style={{ alignSelf: "flex-end" }} onPress={() => this.props.navigation.goBack()} />
          {this.state.id && (
            <View style={{ flex: 1, paddingLeft: 20, paddingRight: 20 }}>
              <Button
                style={{ alignSelf: "stretch", marginBottom: 10 }}
                title="From Gallery"
                onPress={() => this.pickImage(this.state.id)}
              >
                <Text>From Gallery</Text>
              </Button>
              <Button style={{ alignSelf: "stretch", marginBottom: 20 }} onPress={() => this.openCamera(this.state.id)}>
                <Text>Take Picture (Camera)</Text>
              </Button>
            </View>
          )}
          {this.state.image && (
            <Image
              source={{ uri: this.state.image }}
              style={{
                alignSelf: "stretch",
                flex: 2,
                marginLeft: 5,
                marginRight: 5,
                width: undefined,
                height: undefined
              }}
            />
          )}
        </View>
      </View>
    )
  }
}
export default connect(
  utils.mapStateToProps("ofc", ["login"]),
  utils.mapDispatchToProps
)(GetPhotoModal)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
})
