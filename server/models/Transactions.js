var mongoose = require('mongoose')

var TransactionsSchema = new mongoose.Schema({
  type: { type: String, enum: ['Success', 'Error', 'Log'] },
  mode: { type: String, enum: ['SMS', 'Email', 'Notification'] },
  subject: String,
  recordId: String,
  description: String,
  response: String,
  to: String,
  created_at: { type: Date },
  updated_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Transactions', TransactionsSchema)
