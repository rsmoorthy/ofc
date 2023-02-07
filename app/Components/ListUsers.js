import React, { Component } from "react"
import { StyleSheet, ScrollView, FlatList, TextInput, Picker, TouchableOpacity, TouchableHighlight, Image } from "react-native"
import { getStatusBarHeight } from "react-native-status-bar-height"
import { connect } from "react-redux"
import * as utils from "../utils"
import moment from "moment"
import { Audio } from "expo-av"
import Constants from "expo-constants"
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
  Toast
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
              marginBottom: 20
            }}
          >
            <Text style={{ flex: 0.6 }}>{props.row.name}</Text>
            <Text style={{ flex: 0.1, fontSize: 14, color: "#333333" }} />
            <Text style={{ flex: 0.3, fontSize: 14, color: "darkblue" }}>{props.row.mobile}</Text>
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
            <Image
              source={props.row.photo && props.row.photo.length ? { uri: props.row.photo } : require("../assets/user1.jpg")}
              style={{ width: 64, height: 64 }}
            />
            <View style={{ marginLeft: 20, width: "60%" }}>
              <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
                <Text style={{ flex: 0.4, fontSize: 12, color: "#333333" }}>Age </Text>
                <Text style={{ flex: 0.6, fontSize: 14, color: "black" }}>{props.row.age}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
                <Text style={{ flex: 0.4, fontSize: 12, color: "#333333" }}>City </Text>
                <Text style={{ flex: 0.6, fontSize: 14, color: "black" }}>{props.row.city}</Text>
              </View>
              {props.showIcon === false && (
                <>
                  <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
                    <Text style={{ flex: 0.4, fontSize: 12, color: "#333333" }}>CheckIn </Text>
                    <Text style={{ flex: 0.6, fontSize: 14, color: "maroon" }}>{showDateTime(props.row.checkinDate)}</Text>
                  </View>
                  <View style={{ flexDirection: "row", justifyContent: "flex-start" }}>
                    <Text style={{ flex: 0.4, fontSize: 12, color: "#333333" }}>CheckOut: </Text>
                    <Text style={{ flex: 0.6, fontSize: 14, color: "darkgreen" }}>{showDateTime(props.row.checkoutDate)}</Text>
                  </View>
                </>
              )}
            </View>
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

class ListUsers extends Component {
  constructor(props) {
    super(props)

    this.cancelled = false
  }
  state = {
    scope: "current",
    title: "List",
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
    row: {},
    searchCondition: "NotCheckedOut",
    searchDate: moment().format("YYYY-MM-DD"),
    searchText: ""
  }
  static navigationOptions = {
    tabBarIcon: ({ tintColor }) => <Icon name="md-list" style={{ color: tintColor }} />,
    drawerIcon: ({ tintColor }) => <Icon name="md-list" style={{ color: tintColor }} />,
    drawerLabel: "List",
    header: null
  }

  doSetState(st) {
    if (!this.cancelled) this.setState(st)
  }

  componentWillMount() {}

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
              <Button onPress={() => {}}>
                <Icon name="md-refresh" />
              </Button>
            </TouchableOpacity>
          </Right>
        </Header>
        <Content style={{ backgroundColor: "#cccccc", flex: 1 }} contentContainerStyle={{ flex: 1 }}>
          <Card style={{ flex: this.state.searchCondition === "SearchUser" ? 0.2 : 0.1, marginLeft: 5, marginRight: 5 }}>
            <CardItem style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 10 }}>
              <Body style={{ flex: 1 }}>
                <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start" }}>
                  <View style={{ flex: 0.5, alignSelf: "flex-start", borderColor: "gray", borderRadius: 5, borderWidth: 2 }}>
                    <Picker
                      selectedValue={this.state.searchCondition}
                      style={{ height: 30 }}
                      itemStyle={{ borderColor: "gray", borderWidth: 1, borderRadius: 5 }}
                      onValueChange={(itemValue, itemIndex) => this.setState({ searchCondition: itemValue })}
                    >
                      {["", "CheckinList", "NotCheckedOut", "AbsenteeList", "SearchUser"].map(condition => (
                        <Picker.Item label={condition} key={condition} value={condition} />
                      ))}
                    </Picker>
                  </View>
                  <View style={{ flex: 0.35, paddingLeft: 5 }}>
                    <TextInput
                      placeholder="Date"
                      value={this.state.searchDate}
                      onChangeText={date => this.setState({ searchDate: date })}
                      style={{
                        height: 32,
                        paddingLeft: 10,
                        fontSize: 14,
                        borderColor: "gray",
                        borderWidth: 2,
                        color: "brown",
                        fontWeight: "bold"
                      }}
                    />
                  </View>
                  <View style={{ flex: 0.15, paddingLeft: 5 }}>
                    <TouchableOpacity onPress={() => this.props.searchCheckins()}>
                      <Button
                        small
                        success
                        onPress={() =>
                          this.props.searchCheckins({
                            query: this.state.searchCondition,
                            date: this.state.searchDate,
                            searchText: this.state.searchText
                          })
                        }
                      >
                        <Text>Go</Text>
                      </Button>
                    </TouchableOpacity>
                  </View>
                </View>
                {this.state.searchCondition === "SearchUser" && (
                  <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start" }}>
                    <TextInput
                      placeholder="By Name/Mobile/Email/Barcode. Type few chars"
                      value={this.state.searchText}
                      onChangeText={txt => this.setState({ searchText: txt })}
                      style={{
                        fontSize: 17,
                        paddingLeft: 5,
                        paddingRight: 5,
                        borderColor: "#afafaf",
                        borderWidth: 0.5,
                        color: "#e83e8c",
                        fontWeight: "bold"
                      }}
                    />
                  </View>
                )}
              </Body>
            </CardItem>
          </Card>
          <Card style={{ flex: 0.9, marginLeft: 5, marginRight: 5 }}>
            <CardItem style={{ flex: 1, paddingLeft: 10, paddingRight: 10, paddingTop: 10, paddingBottom: 10 }}>
              <Body style={{ flex: 1 }}>
                <FlatList
                  data={this.props.ofc.searchOutput}
                  style={{ width: "100%" }}
                  refreshing={this.isRefreshing()}
                  onRefresh={() => console.log}
                  keyExtractor={(item, index) => item._id}
                  ListHeaderComponent={() => <View />}
                  ListEmptyComponent={() => (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                      <Text style={{ color: "gray", marginTop: 10, fontStyle: "italic" }}>No records</Text>
                    </View>
                  )}
                  renderItem={({ item, index, separators }) => (
                    <TouchableHighlight
                      onPress={() => console.log}
                      onShowUnderlay={separators.highlight}
                      onHideUnderlay={separators.unhighlight}
                    >
                      {this.state.searchCondition === "SearchUser" ? (
                        <UserView style={{ flex: 0.4 }} showIcon={true} header="" checkinData={item.checkinData} row={item} />
                      ) : (
                        <View style={{ padding: 5, margin: 6, backgroundColor: "#F8F8F8" }}>
                          <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start" }}>
                            <Text style={{ flex: 0.4 }}>{item.name}</Text>
                            <Text style={{ flex: 0.2, fontSize: 12, color: "gray" }}>{item.age}</Text>
                            <Text style={{ flex: 0.4, fontSize: 12, color: "darkblue" }}>{item.mobile}</Text>
                          </View>
                          <View style={{ flex: 1, flexDirection: "row", justifyContent: "flex-start" }}>
                            <Text style={{ flex: 0.5 }}>In: {this.showDateTime(item.checkinDate)}</Text>
                            <Text style={{ flex: 0.5 }}>Out: {this.showDateTime(item.checkoutDate)}</Text>
                          </View>
                        </View>
                      )}
                    </TouchableHighlight>
                  )}
                />
              </Body>
            </CardItem>
          </Card>
        </Content>
        {this.state.loading && <Spinner />}
      </Container>
    )
  }
}
export default connect(
  utils.mapStateToProps("ofc", ["login", "users", "meta", "ofc", "checkins", "locations"]),
  utils.mapDispatchToProps
)(ListUsers)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white"
  }
})
