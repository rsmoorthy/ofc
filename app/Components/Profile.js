import React, { Component } from "react"
import { View, StyleSheet, Image, Dimensions, FlatList, TouchableOpacity, TouchableHighlight } from "react-native"
import moment from "moment"

import {
  Container,
  Content,
  Icon,
  Header,
  Left,
  Body,
  Right,
  Segment,
  Button,
  Text,
  List,
  ListItem,
  Thumbnail
} from "native-base"
import EntypoIcon from "react-native-vector-icons/Entypo"
import MaterialIcons from "react-native-vector-icons/MaterialIcons"
import mci from "react-native-vector-icons/MaterialCommunityIcons"
import { getStatusBarHeight } from "react-native-status-bar-height"
import { connect } from "react-redux"
import * as utils from "../utils"

var { height, width } = Dimensions.get("window")

class Profile extends Component {
  static navigationOptions = {
    tabBarIcon: ({ tintColor }) => <Icon name="person" style={{ color: tintColor }} />,
    drawerIcon: ({ tintColor }) => <Icon name="person" style={{ color: tintColor }} />
  }

  constructor(props) {
    super(props)

    this.state = {
      activeIndex: 0
    }
  }

  segmentClicked(index) {
    this.setState({
      activeIndex: index
    })
  }
  checkActive = index => {
    if (this.state.activeIndex !== index) {
      return { color: "grey" }
    } else {
      return {}
    }
  }

  renderSection() {
    if (this.state.activeIndex === 0) {
      return (
        <View>
          <List>
            {this.props.notifications.length === 0 && (
              <ListItem>
                <Body>
                  <Text style={{ fontStyle: "italic", color: "gray" }}>No Notifications</Text>
                </Body>
              </ListItem>
            )}
            {this.props.notifications.map((notification, index) => (
              <ListItem
                key={index}
                style={{
                  marginBottom: 5,
                  paddingTop: 5,
                  paddingBottom: 5,
                  backgroundColor: "white"
                }}
              >
                <Body>
                  <Text style={{ fontSize: 20, color: "darkblue" }}>{notification.title}</Text>
                  <Text note style={{ fontSize: 13, color: "#111111" }}>
                    {notification.body}
                  </Text>
                </Body>
                <Right>
                  <Text style={{ fontSize: 9, color: "gray" }}> {moment(notification.time).format("YYYY-MM-DD")} </Text>
                  <Text style={{ fontSize: 9, color: "gray" }}> {moment(notification.time).format("HH:mm")} </Text>
                </Right>
              </ListItem>
            ))}
          </List>
        </View>
      )
    } else if (this.state.activeIndex === 1) {
      return (
        <View>
          <Text />
        </View>
      )
    } else if (this.state.activeIndex === 2) {
      return (
        <View>
          <Text />
        </View>
      )
    } else if (this.state.activeIndex === 3) {
      return (
        <View>
          <Text />
        </View>
      )
    }
  }

  render() {
    const opacity = this.props.meta.screenOpacity
    const photo =
      this.props.login.photo && this.props.login.photo.length
        ? { uri: this.props.login.photo }
        : require("../assets/user1.jpg")
    return (
      <Container style={{ flex: 1, backgroundColor: "#EAE8EF", opacity: opacity }}>
        <Header
          style={{
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
            <Text style={{ fontSize: 20, color: "white" }}>Profile</Text>
          </Body>
          <Right>
            <Button transparent onPress={() => this.props.doLogout()}>
              <Icon name="ios-log-out" />
            </Button>
          </Right>
        </Header>

        <Content>
          <View style={{ paddingTop: 10 }}>
            {/** User Photo Stats**/}
            <View style={{ flexDirection: "row" }}>
              {/** User photo takes 1/3rd of view horizontally **/}
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "flex-start"
                }}
              >
                <TouchableOpacity
                  onPress={() =>
                    this.props.navigation.push("GetPhotoModal", {
                      id: this.props.login.id,
                      image: this.props.login.photo
                    })
                  }
                >
                  <Image source={photo} style={{ width: 75, height: 75, borderRadius: 37.5 }} />
                </TouchableOpacity>
              </View>

              {/** User Stats take 2/3rd of view horizontally **/}
              <View style={{ flex: 3 }}>
                {/** Stats **/}
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-around",
                    alignItems: "flex-end"
                  }}
                >
                  <View style={{ alignItems: "center" }}>
                    <Text>{this.props.login.rating ? this.props.login.rating : "n/a"}</Text>
                    <Text style={{ fontSize: 10, color: "grey" }}>License</Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text>{this.props.login.lastSeen ? utils.lastSeen(this.props.login.lastSeen) : "never"}</Text>
                    <Text style={{ fontSize: 10, color: "grey" }}>Last seen</Text>
                  </View>
                </View>

                <View
                  style={{
                    flex: 1,
                    alignItems: "flex-start",
                    padding: 20,
                    marginTop: 20
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{this.props.login.name}</Text>
                  {this.props.login.email && (
                    <View style={{ flexDirection: "row" }}>
                      <Icon name="ios-mail-outline" style={{ fontSize: 16 }} />
                      <Text style={{ fontSize: 16, marginLeft: 5, color: "green" }}>{this.props.login.email}</Text>
                    </View>
                  )}
                  {this.props.login.mobile && (
                    <View style={{ flexDirection: "row" }}>
                      <Icon name="ios-phone-portrait" style={{ fontSize: 16 }} />
                      <Text style={{ fontSize: 16, marginLeft: 5, color: "green" }}>{this.props.login.mobile}</Text>
                    </View>
                  )}
                  <Text>{this.props.login.role}</Text>
                  <TouchableHighlight
                    style={{
                      flex: 0.1,
                      padding: 0,
                      marginTop: 10,
                      marginBottom: 1,
                      alignItems: "center",
                      justifyContent: "center"
                    }}
                    onPress={() => this.props.navigation.push("ChangePasswordModal")}
                  >
                    <View
                      style={{
                        height: 30,
                        padding: 5,
                        backgroundColor: "#2296f3"
                      }}
                    >
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 12,
                          color: "white",
                          fontWeight: "bold"
                        }}
                      >
                        Change Password
                      </Text>
                    </View>
                  </TouchableHighlight>
                </View>
              </View>
            </View>
          </View>

          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-around",
                borderTopWidth: 1,
                borderTopColor: "#eae5e5"
              }}
            >
              <Button onPress={() => this.segmentClicked(0)} transparent active={this.state.activeIndex === 0}>
                <Icon
                  name="ios-notifications-outline"
                  style={[this.state.activeIndex === 0 ? {} : { color: "grey" }]}
                />
              </Button>
              <Button onPress={() => this.segmentClicked(1)} transparent active={this.state.activeIndex === 1}>
                <Icon
                  name="ios-list-outline"
                  style={[{ fontSize: 32 }, this.state.activeIndex === 1 ? {} : { color: "grey" }]}
                />
              </Button>
              <Button onPress={() => this.segmentClicked(2)} transparent active={this.state.activeIndex === 2}>
                <Icon name="ios-plane" style={this.state.activeIndex === 2 ? {} : { color: "grey" }} />
              </Button>
              <Button onPress={() => this.segmentClicked(3)} transparent last active={this.state.activeIndex === 3}>
                <Icon
                  name="ios-people-outline"
                  style={[{ fontSize: 32 }, this.state.activeIndex === 3 ? {} : { color: "grey" }]}
                />
              </Button>
            </View>

            {/** Height =width/3 so that image sizes vary according to size of the phone yet remain squares **/}

            {this.renderSection(this.props.notifications)}
          </View>
        </Content>
      </Container>
    )
  }
}
export default connect(
  utils.mapStateToProps("ofc", ["login", "notifications", "meta"]),
  utils.mapDispatchToProps
)(Profile)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#EAE8EF"
  }
})
