const mongoose = require('mongoose');
const { Schema } = mongoose;
const bcrypt = require('bcrypt');

const AdminSchema = new Schema({
  username: {type:String, unique:true},
  passwordHash: String
});

// helper to set default admin
AdminSchema.statics.ensureDefault = async function(){
  const Admin = this;
  const existing = await Admin.findOne({username:'admin'});
  if(!existing){
    const hash = await bcrypt.hash('admin@123', 10);
    await Admin.create({username:'admin', passwordHash: hash});
    console.log('Default admin created: admin / admin@123');
  }
};

module.exports = mongoose.model('AdminUser', AdminSchema);
