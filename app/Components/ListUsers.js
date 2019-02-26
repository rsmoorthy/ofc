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
    searchDate: moment().format("YYYY-MM-DD")
  }
  static navigationOptions = {
    tabBarIcon: ({ tintColor }) => <Icon name="ios-home" style={{ color: tintColor }} />,
    drawerIcon: ({ tintColor }) => <Icon name="ios-home" style={{ color: tintColor }} />,
    drawerLabel: "Home",
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
          <KeepAwake />
          <Card style={{ flex: 0.1, marginLeft: 5, marginRight: 5 }}>
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
                      {["", "CheckinList", "NotCheckedOut", "AbsenteeList"].map(condition => (
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
                        onPress={() => this.props.searchCheckins({ query: this.state.searchCondition, date: this.state.searchDate })}
                      >
                        <Text>Go</Text>
                      </Button>
                    </TouchableOpacity>
                  </View>
                </View>
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
