const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ParentSchema = new Schema({
  name: String,
  phone: String
}, {_id:false});

const StudentSchema = new Schema({
  studentId: {type:String, unique:true, index:true}, // login id
  name: String,
  room: String,
  balance_cents: {type:Number, default:0},
  parents: [ParentSchema], // allowed numbers
  passwordHash: String,
  createdAt: {type:Date, default:Date.now}
});

module.exports = mongoose.model('Student', StudentSchema);
