var mongoose = require("mongoose")

var CheckinsSchema = new mongoose.Schema({
  yatraid: String,
  name: String,
  email: String,
  mobile: String,
  age: Number,
  barcode: String,
  travelGroup: String,
  checkinData: mongoose.Schema.Types.Mixed,
  checkinDate: { type: Date },
  checkoutDate: { type: Date },
  lastSeenDate: { type: Date },
  created_at: { type: Date },
  updated_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model("Checkins", CheckinsSchema)
