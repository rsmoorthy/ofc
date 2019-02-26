import { createStore, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'
import rootReducer from './reducers'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2'

const persistConfig = {
  key: 'root',
  storage,
  stateReconciler: autoMergeLevel2
}
const persistedReducer = persistReducer(persistConfig, rootReducer)

const initialState = {}
const enhancers = []
const middleware = [thunk]

const composedEnhancers = compose(applyMiddleware(...middleware))

export const store = createStore(persistedReducer, initialState, composedEnhancers)
export const persistor = persistStore(store)
/*
export default () => {
  let store = createStore(persistedReducer, initialState, composedEnhancers)
  let persistor = persistStore(store)
  return { store, persistor }
}
*/
