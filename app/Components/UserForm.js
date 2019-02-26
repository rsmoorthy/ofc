import React, { Component } from "react"
import { connect } from "react-redux"
import * as utils from "../utils"
import { View, StyleSheet } from "react-native"
import t from "tcomb-form-native" // 0.6.9

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
  StyleProvider
} from "native-base"
import { getStatusBarHeight } from "react-native-status-bar-height"
// import getTheme from '../../native-base-theme/components'
// import material from '../../native-base-theme/variables/material'
// import platform from '../../native-base-theme/variables/platform'

const Form = t.form.Form
const FormUser = t.struct({
  _id: t.String,
  name: t.String,
  email: t.maybe(utils.tform.Email),
  mobile: t.maybe(t.String),
  password: t.maybe(t.String),
  disabled: t.maybe(t.enums({ No: "No", Yes: "Yes" })),
  group: t.maybe(t.enums({ Group1: "Group1", Group2: "Group2", Group3: "Group3", Group4: "Group4", Group5: "Group5", Group6: "Group6" })),
  role: t.enums({ User: "User", Teacher: "Teacher", Admin: "Admin", None: "None" })
})

const options = {
  fields: {
    password: {
      placeholder: "Leave it empty, to keep passwd unchanged",
      secureTextEntry: true
    },
    _id: {
      hidden: true
    }
  },
  stylesheet: utils.formStyles
}

class UserForm extends Component {
  constructor(props) {
    super(props)
    this.state = {
      initialized: false,
      value: {
        role: "",
        name: "",
        email: "",
        mobile: "",
        password: "",
        group: ""
      }
    }
  }
  static navigationOptions = {
    tabBarIcon: ({ tintColor }) => <Icon name="ios-plane" style={{ color: tintColor }} />,
    header: null
  }

  handleSubmit = () => {
    const value = this._form.getValue()
    if (value) {
      this.state.value = value
      this.props.doUpdateUser(value)
    }
  }

  render() {
    const user = this.props.navigation.getParam("user", {})
    if (this.state.initialized === false) {
      this.state.value = user
      this.state.initialized = true
    }
    return (
      <Container>
        <Header style={{ paddingLeft: 10, paddingTop: getStatusBarHeight(), height: 54 + getStatusBarHeight() }}>
          <Left>
            <Button transparent>
              <Icon name="md-arrow-back" onPress={() => this.props.navigation.goBack()} />
            </Button>
          </Left>
          <Body>
            <Title>User Data</Title>
          </Body>
        </Header>
        <Content>
          <View style={styles.container}>
            <View>
              <Form ref={c => (this._form = c)} type={FormUser} value={this.state.value} options={options} />
              <Button title="Update User" onPress={() => this.handleSubmit()}>
                <Text>Update User</Text>
              </Button>
              <Text style={{ color: "red", fontSize: 22 }}>{this.props.meta.updateUserError}</Text>
              <Text style={{ color: "green", fontSize: 22 }}>{this.props.meta.updateUserSuccess}</Text>
            </View>
          </View>
        </Content>
      </Container>
    )
  }
}
export default connect(
  utils.mapStateToProps("ofc", ["login", "meta"]),
  utils.mapDispatchToProps
)(UserForm)

const styles = StyleSheet.create({
  container: {
    marginTop: 30,
    marginLeft: 30,
    marginRight: 30,
    marginBottom: 30,
    justifyContent: "center"
  }
})
