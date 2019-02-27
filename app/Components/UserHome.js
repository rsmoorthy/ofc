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
import MaterialIcon from "react-native-vector-icons/MaterialIcons"

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
  Toast,
  Badge
} from "native-base"
// import CardComponent from './CardComponent'
const showDateTime = dt => {
  return dt ? moment(dt).format("HH:mm DD-MM") : ""
}

const UserView = props => (
  <Card style={{ flex: 0.25, marginLeft: 5, marginRight: 5, marginBottom: 0, marginTop: 2, ...(props.style ? props.style : {}) }}>
    <CardItem style={{ flex: 1, paddingLeft: 5, paddingRight: 5 }}>
      <Body style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start", alignItems: "center", padding: 0, margin: 0 }}>
        {props.showIcon && <MaterialIcon name="check-box" size={40} style={{ flex: 0.1, color: "green", marginRight: 10 }} />}
        <View style={{ flex: 0.9 }}>
          <View
            style={{
              width: "100%",
              alignSelf: "center",
              justifyContent: "center",
              marginBottom: 5,
              paddingBottom: 5,
              borderBottomColor: "gray",
              borderBottomWidth: 0.5
            }}
          >
            <View style={{ alignSelf: "center", backgroundColor: "green", padding: 2, borderRadius: 2 }}>
              <Text style={{ color: "white", fontSize: 10 }}>{props.header}</Text>
            </View>
          </View>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "flex-start",
              borderBottomColor: "gray",
              borderBottomWidth: 0.5,
              marginBottom: 20
            }}
          >
            <Text style={{ flex: 0.6 }}>{props.row.name}</Text>
            <Text style={{ flex: 0.1, fontSize: 14, color: "#333333" }}>{props.row.age}</Text>
            <Text style={{ flex: 0.3, fontSize: 14, color: "darkblue" }}>{props.row.mobile}</Text>
          </View>
          <FlatList
            style={{ width: "100%", marginTop: 10, borderBottomColor: "gray", borderBottomWidth: 0.5 }}
            data={props.checkinData}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({ item }) => (
              <View style={{ flex: 1, flexDirection: "row" }}>
                <View style={{ flex: 1 / 3 }}>
                  <Text style={{ color: "darkblue", fontSize: 14 }}>{item.location}</Text>
                </View>
                <View style={{ flex: 1 / 3 }}>
                  <View
                    style={{
                      alignSelf: "center",
                      backgroundColor: item.direction === "In" ? "#e7003f" : "#00b949",
                      padding: 5,
                      borderRadius: 2
                    }}
                  >
                    <Text style={{ color: "white", fontSize: 12 }}>{item.direction}</Text>
                  </View>
                </View>
                <View style={{ flex: 1 / 3 }}>
                  <Text style={{ color: "darkblue", fontSize: 14 }}>{showDateTime(item.date)}</Text>
                </View>
              </View>
            )}
          />
        </View>
      </Body>
    </CardItem>
  </Card>
)

class UserHome extends Component {
  constructor(props) {
    super(props)

    this.doSetState = this.doSetState.bind(this)
    this.doCheckin = this.doCheckin.bind(this)
    this.playSound = this.playSound.bind(this)
    this.cancelled = false
    this.soundError = new Audio.Sound()
    this.soundError
      .loadAsync(require("../assets/sounds/Buzz.mp3"))
      .then(() => {})
      .catch(console.log)
    this.soundOk = new Audio.Sound()
    try {
      this.soundOk
        .loadAsync(require("../assets/sounds/Bleep.mp3"))
        .then(() => {})
        .catch(console.log)
    } catch (error) {
      console.log(error)
    }
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
    showBoxTimer: moment(),
    showBox: false,
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
    try {
      if (mode === "error") await this.soundError.playAsync()
      else await this.soundOk.playAsync()
    } catch {}
  }

  async playError() {}

  doCheckin(barcode) {
    this.setState({ barcode: barcode })
    if (barcode.length === 8) {
      if (!(this.props.ofc.location && this.props.ofc.direction)) {
        return Toast.show({
          text: "Location or Direction Not set",
          buttonText: "Ok",
          type: "danger",
          duration: 10000
        })
      }
      this.props.commitCheckin(
        {
          barcode: barcode,
          location: this.props.ofc.location,
          direction: this.props.ofc.direction,
          date: moment().format("YYYY-MM-DD[T]HH:mm:ssZ")
        },
        async (err, row) => {
          if (err !== null) {
            this.setState({ errorText: err, showBox: true, showBoxTimer: moment(), barcode: "", statusBarcode: barcode })
            await this.playSound("error")
            return
          }
          this.setState({ errorText: "", row: row || {}, showBox: true, showBoxTimer: moment(), barcode: "", statusBarcode: barcode })
          await this.playSound("ok")
        }
      )
    }
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
    this.timer2 = setInterval(() => {
      if (this.state.showBox && moment().diff(moment(this.state.showBoxTimer)) > 20000) this.setState({ showBox: false })
    }, 1000)
  }

  componentWillUnmount() {
    this.cancelled = true
    if (this.timer) clearInterval(this.timer)
    if (this.timer2) clearInterval(this.timer2)
  }

  showDateTime(dt) {
    return dt ? moment(dt).format("HH:mm DD-MM") : ""
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
          <Card style={{ flex: 0.1, marginLeft: 5, marginRight: 5, marginBottom: 0 }}>
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
          <Card style={{ flex: 0.1, marginLeft: 5, marginRight: 5, marginBottom: 0, marginTop: 2 }}>
            <CardItem style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 10 }}>
              <Body style={{ flex: 1 }}>
                <View style={{ flex: 1, flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                  <View style={{ flex: 1 / 3, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: "#333333", fontSize: 11 }}>Entries</Text>
                    <Text style={{ color: "darkgreen", fontSize: 22, fontWeight: "bold" }}>{this.props.ofc.checkins.length}</Text>
                  </View>
                  <View style={{ flex: 1 / 3, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: "#333333", fontSize: 11 }}>Swipes In Device</Text>
                    <Text style={{ color: "darkgreen", fontSize: 22, fontWeight: "bold" }}>{this.props.ofc.deviceCheckins}</Text>
                  </View>
                  <View style={{ flex: 1 / 3, justifyContent: "center", alignItems: "center" }}>
                    <Text style={{ color: "#333333", fontSize: 11 }}>To Be Synced</Text>
                    <Text style={{ color: "darkgreen", fontSize: 22, fontWeight: "bold" }}> {this.props.ofc.commits.length} </Text>
                  </View>
                </View>
              </Body>
            </CardItem>
          </Card>
          <Card style={{ flex: 0.15, marginLeft: 5, marginRight: 5, marginBottom: 0, marginTop: 2 }}>
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
          {this.state.errorText.length > 0 && this.state.showBox && (
            <Card style={{ flex: 0.15, marginLeft: 5, marginRight: 5, marginBottom: 0, marginTop: 2 }}>
              <CardItem
                style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 10, backgroundColor: "#f8f8f8" }}
              >
                <Body style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start", alignItems: "center" }}>
                  <MaterialIcon name="error" size={40} style={{ color: "red" }} />
                  <Text style={{ color: "maroon", fontSize: 16 }}>{this.state.errorText}</Text>
                </Body>
              </CardItem>
            </Card>
          )}
          {this.state.errorText.length === 0 &&
            this.state.showBox &&
            Object.keys(this.state.row).length > 0 &&
            this.props.ofc.commits.filter(item => item.barcode === this.state.row.barcode).length > 0 && (
              <UserView
                showIcon={true}
                header="Local View"
                checkinData={this.props.ofc.commits.filter(item => item.barcode === this.state.row.barcode)}
                row={this.state.row}
              />
            )}
          {this.state.errorText.length === 0 &&
            this.state.showBox &&
            Object.keys(this.state.row).length > 0 &&
            this.props.ofc.commits.filter(item => item.barcode === this.state.row.barcode).length === 0 && (
              <UserView
                style={{ flex: 0.6 }}
                showIcon={false}
                header="Server View"
                checkinData={this.props.ofc.checkins.find(item => item.barcode === this.state.row.barcode).checkinData}
                row={this.state.row}
              />
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
/*
            data={[...props.commits.filter(item => item.barcode === props.row.barcode)]}
              <Card style={{ flex: 0.25, marginLeft: 5, marginRight: 5, marginBottom: 0, marginTop: 2 }}>
                <CardItem style={{ flex: 1, paddingLeft: 5, paddingRight: 5 }}>
                  <Body
                    style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start", alignItems: "center", padding: 0, margin: 0 }}
                  >
                    <MaterialIcon name="check-box" size={40} style={{ flex: 0.1, color: "green", marginRight: 10 }} />
                    <View style={{ flex: 0.9 }}>
                      <View
                        style={{
                          width: "100%",
                          alignSelf: "center",
                          justifyContent: "center",
                          marginBottom: 5,
                          paddingBottom: 5,
                          borderBottomColor: "gray",
                          borderBottomWidth: 0.5
                        }}
                      >
                        <View style={{ alignSelf: "center", backgroundColor: "green", padding: 2, borderRadius: 2 }}>
                          <Text style={{ color: "white", fontSize: 10 }}>Local View</Text>
                        </View>
                      </View>
                      <View
                        style={{
                          flex: 1,
                          flexDirection: "row",
                          justifyContent: "flex-start",
                          borderBottomColor: "gray",
                          borderBottomWidth: 0.5
                        }}
                      >
                        <Text style={{ flex: 0.6 }}>{this.state.row.name}</Text>
                        <Text style={{ flex: 0.1, fontSize: 14, color: "#333333" }}>{this.state.row.age}</Text>
                        <Text style={{ flex: 0.3, fontSize: 14, color: "darkblue" }}>{this.state.row.mobile}</Text>
                      </View>
                      <FlatList
                        style={{ width: "100%", marginTop: 10, borderBottomColor: "gray", borderBottomWidth: 0.5 }}
                        data={[...this.props.ofc.commits.filter(item => item.barcode === this.state.row.barcode)]}
                        keyExtractor={(item, index) => index.toString()}
                        renderItem={({ item }) => (
                          <View style={{ flex: 1, flexDirection: "row" }}>
                            <View style={{ flex: 1 / 3 }}>
                              <Text style={{ color: "darkblue", fontSize: 14 }}>{item.location}</Text>
                            </View>
                            <View style={{ flex: 1 / 3 }}>
                              <View
                                style={{
                                  alignSelf: "center",
                                  backgroundColor: item.direction === "In" ? "#e7003f" : "#00b949",
                                  padding: 5,
                                  borderRadius: 2
                                }}
                              >
                                <Text style={{ color: "white", fontSize: 12 }}>{item.direction}</Text>
                              </View>
                            </View>
                            <View style={{ flex: 1 / 3 }}>
                              <Text style={{ color: "darkblue", fontSize: 14 }}>{this.showDateTime(item.date)}</Text>
                            </View>
                          </View>
                        )}
                      />
                    </View>
                  </Body>
                </CardItem>
              </Card>
          {this.state.errorText.length === 0 &&
            this.state.showBox &&
            false &&
            Object.keys(this.state.row).length > 0 &&
            this.props.ofc.commits.filter(item => item.barcode === this.state.row.barcode).length === 0 && (
              <Card style={{ flex: 0.75, marginLeft: 5, marginRight: 5, marginBottom: 0, marginTop: 2 }}>
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
                      data={[
                        ...(this.state.row.checkinData ? this.state.row.checkinData : []),
                        ...this.props.ofc.commits.filter(item => item.barcode === this.state.row.barcode)
                      ]}
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
                */
