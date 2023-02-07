module.exports = {
  "parser": "babel-eslint",
  "extends": [
    "standard",
    "prettier",
    "prettier/react"
  ],
  "plugins": [
    "react",
    "react-native",
    "prettier"
  ],
  "parserOptions":{
    "ecmaVersion":2016,
    "sourceType":"module",
    "ecmaFeatures": {
      "jsx":true
    }
  },
  "env":{
    "es6":true,
  },
  "rules": {
    "no-unused-vars": "off",
    "max-len": ["error", { "code": 140 }],
    "semi": ["error", "never"]
  }
};
