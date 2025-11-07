const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const CallSchema = new Schema({
  studentId: String,
  parent_phone: String,
  started_at: Date,
  duration_seconds: Number,
  direction: String
});
module.exports = mongoose.model('CallHistory', CallSchema);
