const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const Student = require('../models/Student');
const bcrypt = require('bcrypt');

const SECRET = process.env.JWT_SECRET;

// ensure default admin exists on startup
AdminUser.ensureDefault().catch(()=>{});

router.post('/admin/login', async (req,res)=>{
  const {username,password} = req.body;
  const admin = await AdminUser.findOne({username});
  if(!admin) return res.status(401).json({error:'invalid'});
  const ok = await bcrypt.compare(password, admin.passwordHash);
  if(!ok) return res.status(401).json({error:'invalid'});
  const token = jwt.sign({role:'admin', username}, SECRET, {expiresIn:'8h'});
  res.json({token});
});

// student login by studentId + password (we'll store passwordHash in student record)
router.post('/student/login', async (req,res)=>{
  const {studentId, password} = req.body;
  const student = await Student.findOne({studentId});
  if(!student) return res.status(401).json({error:'invalid'});
  const hash = student.passwordHash;
  if(!hash){
    // default check: password equals studentId
    if(password !== student.studentId) return res.status(401).json({error:'invalid'});
  } else {
    const ok = await bcrypt.compare(password, hash);
    if(!ok) return res.status(401).json({error:'invalid'});
  }
  const token = jwt.sign({role:'student', studentId: student.studentId}, SECRET, {expiresIn:'8h'});
  res.json({token});
});

module.exports = router;
