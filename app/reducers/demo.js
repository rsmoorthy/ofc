const initialState = {
  counter: 3,
  text: '',
  apps: [],
  dummyData: {}
}

export default (state = initialState, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return {
        ...state,
        counter: state.counter + 1,
        apps: [...state.apps, state.counter],
        text: state.text + ' (' + state.text.length + ')'
      }

    case 'SET':
      let val = parseInt(action.value, 10)
      if (isNaN(val)) return state
      return {
        ...state,
        counter: val
      }

    case 'TXTSET':
      return {
        ...state,
        text: action.value
      }

    case 'GO_BACK':
      // typeof action.history === "object" && action.history.goBack()
      return {
        ...state,
        apps: state.apps.length ? state.apps.slice(1) : state.apps
      }

    case 'DUMMY_DATA':
      const id = action.id
      return {
        ...state,
        dummyData: { ...state.dummyData, [id]: action.value }
      }

    default:
      return state
  }
}
