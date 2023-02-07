var request = require("request-promise")
var sharp = require("sharp")
const csv = require("fast-csv")
const R = require("ramda")

const login = async () => {
  let options = { method: "POST", form: { username: "admin@journo.in", password: "wpc1c0", 
          do: "login", submit: "Sign in"} , url: "https://cico.isha.in/login.php", 
          resolveWithFullResponse: true }
  try {
    var response = await request(options)
    console.log("ok", response)
  } catch(resp) {
    if(resp.statusCode == "302") {
      var cookies = resp.response.headers['set-cookie']
      console.log(cookies)
    }
  }
}

login().then(() => {
  console.log("done")
})
