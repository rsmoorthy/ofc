import { StackActions, NavigationActions } from 'react-navigation'

let _navigator

function setContainer(container, where) {
  _navigator = container
}

function navigate(routeName, params, subroute) {
  console.log('navigate ' + routeName)
  _navigator.dispatch(
    NavigationActions.navigate({
      routeName,
      params,
      action: subroute ? NavigationActions.navigate({ routeName: subroute }) : null
    })
  )
}

function push(routeName, params, subroute) {
  console.log('push ' + routeName)
  _navigator.dispatch(
    StackActions.push({
      routeName,
      params,
      action: subroute ? NavigationActions.navigate({ routeName: subroute }) : null
    })
  )
}

export default {
  navigate,
  push,
  setContainer
}
