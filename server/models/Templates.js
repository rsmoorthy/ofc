var mongoose = require('mongoose')

var TemplatesSchema = new mongoose.Schema({
  type: { type: String, enum: ['SMS', 'Email', 'Notification'] },
  name: String,
  template: String,
  created_at: { type: Date },
  updated_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Templates', TemplatesSchema)
