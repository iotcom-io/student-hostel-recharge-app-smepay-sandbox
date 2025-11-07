const mongoose = require('mongoose');
const { Schema } = require('mongoose');
const RechargeSchema = new Schema({
  studentId: String,
  amount_cents: Number,
  status: String,
  provider_txn: String,
  provider_payload: Schema.Types.Mixed,
  created_at: {type:Date, default:Date.now}
});
module.exports = mongoose.model('Recharge', RechargeSchema);
