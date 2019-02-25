var mongoose = require('mongoose')

var ConfigSchema = new mongoose.Schema({
  data: mongoose.Schema.Types.Mixed,
  created_at: { type: Date },
  updated_at: { type: Date, default: Date.now }
})

module.exports = mongoose.model('Config', ConfigSchema)
