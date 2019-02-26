import React, { Component } from "react"
import { StyleSheet, ScrollView, FlatList, TextInput, Picker, TouchableOpacity, TouchableHighlight } from "react-native"
import { getStatusBarHeight } from "react-native-status-bar-height"
import { connect } from "react-redux"
import * as utils from "../utils"
import moment from "moment"
import { Constants, KeepAwake, Audio } from "expo"
import OrangeMarker from "../assets/orange_marker.png"
import FlightMarker from "../assets/flight_marker.png"
import axios from "axios"
import qs from "qs"
import { Spinner, StatusButton } from "./Common"

import {
  Container,
  Content,
  Icon,
  Thumbnail,
  Header,
  View,
  Left,
  Right,
  Body,
  Text,
  Button,
  Card,
  CardItem,
  Alert,
  Toast
} from "native-base"
// import CardComponent from './CardComponent'

class UserHome extends Component {
  constructor(props) {
    super(props)

    this.doSetState = this.doSetState.bind(this)
    this.doCheckin = this.doCheckin.bind(this)
    this.playSound = this.playSound.bind(this)
    this.cancelled = false
  }
  state = {
    scope: "current",
    title: "Home - Checkin",
    backgroundColor: "#4050b5",
    refreshing: false,
    loading: false,
    buttonBackgroundColor: "white",
    textColor: "black",
    buttonText: "...",
    status: "",
    errorText: "",
    barcode: "",
    statusBarcode: "",
    row: {}
  }
  static navigationOptions = {
    tabBarIcon: ({ tintColor }) => <Icon name="ios-home" style={{ color: tintColor }} />,
    drawerIcon: ({ tintColor }) => <Icon name="ios-home" style={{ color: tintColor }} />,
    drawerLabel: "Home",
    header: null
  }

  async playSound(mode) {
    const soundObject = new Audio.Sound()
    try {
      if (mode === "error") await soundObject.loadAsync(require("../assets/sounds/Buzz.mp3"))
      else await soundObject.loadAsync(require("../assets/sounds/Bleep.mp3"))
      await soundObject.playAsync()
      // Your sound is playing!
    } catch (error) {
      console.log("sound error")
      // An error occurred!
    }
  }

  doCheckin(barcode) {
    this.setState({ barcode: barcode })
    if (barcode.length === 8)
      this.props.commitCheckin(
        {
          barcode: barcode,
          location: this.props.ofc.location,
          direction: this.props.ofc.direction,
          date: moment()
        },
        async (err, row) => {
          if (err !== null) {
            this.setState({ errorText: err, barcode: "", statusBarcode: barcode })
            await this.playSound("error")
            return
          }

          this.setState({ errorText: "", row: row, barcode: "", statusBarcode: barcode })
        }
      )
  }

  doSetState(st) {
    if (!this.cancelled) this.setState(st)
  }

  componentWillMount() {
    if (
      !this.props.ofc.lastObtained ||
      (this.props.ofc.lastObtained && moment().diff(moment(this.props.ofc.lastObtained)) > 24 * 60 * 60 * 1000)
    ) {
      /*
      this.doSetState({ refreshing: true })
      this.props.getPiAccessKeys(status => {
        this.doSetState({ refreshing: false })
      })
      */
    }
    this.props.initializeOfc()
    this.props.getLocations()
    this.timer = setInterval(() => this.props.syncCommits(), 10000)
  }

  componentWillUnmount() {
    this.cancelled = true
    if (this.timer) clearInterval(this.timer)
  }

  showDateTime(dt) {
    return dt ? moment(dt).format("hh:mm DD-MM") : ""
  }

  isRefreshing() {
    return this.state.refreshing
  }

  render() {
    return (
      <Container style={styles.container}>
        <Header
          style={{
            backgroundColor: this.state.backgroundColor,
            paddingLeft: 10,
            paddingTop: getStatusBarHeight(),
            height: 54 + getStatusBarHeight()
          }}
        >
          <Left>
            <Button transparent>
              <Icon name="menu" onPress={this.props.navigation.openDrawer} />
            </Button>
          </Left>
          <Body>
            <Text style={{ fontSize: 20, color: "white" }}>{this.state.title}</Text>
          </Body>
          <Right>
            <TouchableOpacity>
              <Button
                onPress={() => {
                  this.props.getLocations()
                  this.props.getCheckins()
                }}
              >
                <Icon name="md-refresh" />
              </Button>
            </TouchableOpacity>
          </Right>
        </Header>
        <Content style={{ backgroundColor: "#cccccc", flex: 1 }} contentContainerStyle={{ flex: 1 }}>
          <KeepAwake />
          <Card style={{ flex: 0.1, marginLeft: 5, marginRight: 5 }}>
            <CardItem style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 10 }}>
              <Body style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
                  <View style={{ flex: 0.5, alignSelf: "flex-start", borderColor: "gray", borderRadius: 5, borderWidth: 2 }}>
                    <Picker
                      selectedValue={this.props.ofc.location}
                      style={{ height: 30, width: 200 }}
                      itemStyle={{ borderColor: "gray", borderWidth: 1, borderRadius: 5 }}
                      onValueChange={(itemValue, itemIndex) => this.props.setLocation(itemValue)}
                    >
                      {this.props.ofc.locations.map(loc => (
                        <Picker.Item label={loc} key={loc} value={loc} />
                      ))}
                    </Picker>
                  </View>
                  <View style={{ flex: 0.25 }} />
                  <TouchableOpacity
                    style={{ flex: 0.25, alignSelf: "center" }}
                    onPress={() => this.props.setDirection(this.props.ofc.direction === "In" ? "Out" : "In")}
                  >
                    <Button
                      onPress={() => this.props.setDirection(this.props.ofc.direction === "In" ? "Out" : "In")}
                      small
                      danger={this.props.ofc.direction === "In"}
                      success={this.props.ofc.direction === "Out"}
                    >
                      <Text style={{ color: "white" }}>{this.props.ofc.direction}</Text>
                    </Button>
                  </TouchableOpacity>
                </View>
              </Body>
            </CardItem>
          </Card>
          <Card style={{ flex: 0.1, marginLeft: 5, marginRight: 5 }}>
            <CardItem style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 10 }}>
              <Body style={{ flex: 1 }}>
                <View style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                  <View style={{ flex: 1 / 3, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: "gray", fontSize: 10 }}>Entries</Text>
                    <Text style={{ color: "darkgreen", fontSize: 20, fontWeight: "bold" }}>{this.props.ofc.checkins.length}</Text>
                  </View>
                  <View style={{ flex: 1 / 3, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: "gray", fontSize: 10 }}>Checkins In Dev</Text>
                    <Text style={{ color: "darkgreen", fontSize: 20, fontWeight: "bold" }}>{this.props.ofc.deviceCheckins}</Text>
                  </View>
                  <View style={{ flex: 1 / 3, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: "gray", fontSize: 10 }}>To Be Synced</Text>
                    <Text style={{ color: "darkgreen", fontSize: 20, fontWeight: "bold" }}> {this.props.ofc.commits.length} </Text>
                  </View>
                </View>
              </Body>
            </CardItem>
          </Card>
          <Card style={{ flex: 0.15, marginLeft: 5, marginRight: 5 }}>
            <CardItem style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 10 }}>
              <Body style={{ flex: 1 }}>
                <Text style={{ color: "#666666", fontSize: 12 }}>Barcode:</Text>
                <TextInput
                  placeholder="Barcode (without hiphens)"
                  value={this.state.barcode}
                  onChangeText={barcode => this.doCheckin(barcode)}
                  style={{
                    height: 40,
                    width: "80%",
                    fontSize: 14,
                    paddingLeft: 20,
                    paddingRight: 20,
                    borderColor: "gray",
                    borderWidth: 2,
                    color: "brown",
                    fontWeight: "bold"
                  }}
                />
              </Body>
            </CardItem>
          </Card>
          {this.state.errorText.length > 0 && (
            <Card style={{ flex: 0.3, marginLeft: 5, marginRight: 5 }}>
              <CardItem
                style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 10, backgroundColor: "#f8f8f8" }}
              >
                <Body style={{ flex: 1 }}>
                  <Text style={{ color: "red", fontSize: 14 }}>{this.state.errorText}</Text>
                </Body>
              </CardItem>
            </Card>
          )}
          {this.state.errorText.length === 0 && Object.keys(this.state.row).length > 0 && (
            <Card style={{ flex: 0.75, marginLeft: 5, marginRight: 5 }}>
              <CardItem style={{ flex: 1, padding: 10, backgroundColor: "#f8f8f8" }}>
                <Body style={{ flex: 1 }}>
                  <FlatList
                    style={{ width: "100%" }}
                    data={[
                      { key: "Barcode", value: this.state.row.barcode },
                      { key: "Name", value: this.state.row.name },
                      { key: "Age", value: this.state.row.age },
                      { key: "Mobile", value: this.state.row.mobile },
                      { key: "Center", value: this.state.row.center },
                      { key: "In", value: this.showDateTime(this.state.row.checkinDate) },
                      { key: "Out", value: this.showDateTime(this.state.row.checkoutDate) }
                    ]}
                    renderItem={({ item }) => (
                      <View style={{ flex: 1, flexDirection: "row" }}>
                        <View style={{ flex: 0.3 }}>
                          <Text style={{ color: "gray", fontSize: 12 }}>{item.key}</Text>
                        </View>
                        <View style={{ flex: 0.7 }}>
                          <Text style={{ color: "darkblue", fontSize: 14 }}>{item.value}</Text>
                        </View>
                      </View>
                    )}
                  />
                  <FlatList
                    style={{ width: "100%" }}
                    data={this.state.row.checkinData}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                      <View style={{ flex: 1, flexDirection: "row" }}>
                        <View style={{ flex: 1 / 3 }}>
                          <Text style={{ color: "darkblue", fontSize: 14 }}>{item.location}</Text>
                        </View>
                        <View style={{ flex: 1 / 3 }}>
                          <Button small danger={item.direction === "In"} success={item.direction === "Out"}>
                            <Text>{item.direction}</Text>
                          </Button>
                        </View>
                        <View style={{ flex: 1 / 3 }}>
                          <Text style={{ color: "darkblue", fontSize: 14 }}>{this.showDateTime(item.date)}</Text>
                        </View>
                      </View>
                    )}
                  />
                </Body>
              </CardItem>
            </Card>
          )}
        </Content>
        {this.state.loading && <Spinner />}
      </Container>
    )
  }
}
export default connect(
  utils.mapStateToProps("ofc", ["login", "users", "meta", "ofc", "checkins", "locations"]),
  utils.mapDispatchToProps
)(UserHome)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  }
})
