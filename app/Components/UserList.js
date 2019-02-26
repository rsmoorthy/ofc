import React, { Component } from "react"
import { connect } from "react-redux"
import * as utils from "../utils"
import { View, StyleSheet, FlatList, TouchableOpacity, TouchableHighlight, Image, RefreshControl } from "react-native"

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

export const UserRatingInfo = ({ item, style }) => (
  <View style={style}>
    <View style={{ flexDirection: "row", justifyContent: "space-around", alignItems: "flex-end" }}>
      <View style={{ alignItems: "center" }}>
        <Text>{item.group}</Text>
        <Text style={{ fontSize: 10, color: "grey" }}>Group</Text>
      </View>
      <View style={{ alignItems: "center" }}>
        <Text>{item.lastSeen ? utils.lastSeen(item.lastSeen) : "never"}</Text>
        <Text style={{ fontSize: 10, color: "grey" }}>Last seen</Text>
      </View>
    </View>
  </View>
)

class _UserList extends Component {
  static navigationOptions = {
    tabBarIcon: ({ tintColor }) => <Icon name="ios-people" style={{ color: tintColor }} />,
    drawerIcon: ({ tintColor }) => <Icon name="ios-people" style={{ color: tintColor }} />,
    header: null
  }

  componentWillMount() {
    this.props.dispatch({ type: "UPDATE_USER_RESET" })
    this.props.getUserList()
  }

  render() {
    const users = this.props.users
    const getUserList = this.props.getUserList
    return (
      <Container>
        <Header style={{ paddingLeft: 10, paddingTop: getStatusBarHeight(), height: 54 + getStatusBarHeight() }}>
          <Left>
            <Button transparent>
              <Icon name="menu" onPress={this.props.navigation.openDrawer} />
            </Button>
          </Left>
          <Body>
            <Title>Users</Title>
          </Body>
          <Right>
            <Button transparent onPress={() => this.props.newVersion(!this.props.meta.newVersion)}>
              <Icon name="md-refresh" />
            </Button>
          </Right>
        </Header>
        <View style={{ flex: 1, backgroundColor: "#EAE8EF" }}>
          <FlatList
            data={this.props.users}
            refreshing={this.props.meta.userListInProgress}
            onRefresh={() => this.props.getUserList()}
            keyExtractor={(item, index) => item._id}
            renderItem={({ item, index, separators }) => (
              <TouchableHighlight
                onPress={() => this.props.navigation.push("UserForm", { user: item })}
                onShowUnderlay={separators.highlight}
                onHideUnderlay={separators.unhighlight}
              >
                <View
                  style={{
                    flexDirection: "row",
                    paddingTop: 10,
                    marginTop: 1,
                    marginBottom: 1,
                    paddingBottom: 10,
                    backgroundColor: index % 2 === 0 ? "#F8F8F8" : "#F8F8F8"
                  }}
                >
                  {/** User photo takes 1/3rd of view horizontally **/}
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "flex-start" }}>
                    <TouchableOpacity onPress={() => this.props.navigation.push("GetPhotoModal", { id: item._id, image: item.photo })}>
                      <Image
                        source={item.photo && item.photo.length ? { uri: item.photo } : require("../assets/user1.jpg")}
                        style={{ width: 52, height: 52, borderRadius: 37.5 }}
                      />
                    </TouchableOpacity>
                    <View
                      style={{
                        borderColor: "pink",
                        borderWidth: 2,
                        borderRadius: 5,
                        marginTop: 5,
                        paddingLeft: 5,
                        paddingRight: 5,
                        paddingTop: 2,
                        alignItems: "center",
                        paddingBottom: 2
                      }}
                    >
                      <Text style={{ fontSize: 13, color: "black" }}>{item.role}</Text>
                    </View>
                  </View>

                  <View style={{ flex: 3 }}>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        paddingTop: 0,
                        justifyContent: "space-around"
                      }}
                    >
                      <Text
                        style={{
                          flex: 2,
                          fontSize: 16,
                          color: "darkblue"
                        }}
                      >
                        {item.name}
                      </Text>
                      <View style={{ flex: 2.5 }}>
                        {item.email && (
                          <View style={{ flexDirection: "row" }}>
                            <Icon name="ios-mail-outline" style={{ fontSize: 16 }} />
                            <Text style={{ fontSize: 11, marginLeft: 5, color: "green" }}>{item.email}</Text>
                          </View>
                        )}
                        {item.mobile && (
                          <View style={{ flexDirection: "row" }}>
                            <Icon name="ios-phone-portrait" style={{ fontSize: 16 }} />
                            <Text style={{ fontSize: 11, marginLeft: 5, color: "green" }}>{item.mobile}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <UserRatingInfo style={{ paddingTop: 10 }} item={item} />
                  </View>
                </View>
              </TouchableHighlight>
            )}
          />
        </View>
      </Container>
    )
  }
}
export const UserList = connect(
  utils.mapStateToProps("ofc", ["login", "users", "meta"]),
  utils.mapDispatchToProps
)(_UserList)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center"
  }
})
