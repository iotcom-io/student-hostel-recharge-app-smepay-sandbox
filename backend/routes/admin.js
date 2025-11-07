const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Recharge = require('../models/Recharge');
const bcrypt = require('bcrypt');

// create student
router.post('/students', async (req,res)=>{
  const {studentId, name, room, parents, password} = req.body;
  const obj = {studentId, name, room, parents};
  if(password){
    obj.passwordHash = await bcrypt.hash(password, 10);
  }
  try{
    const s = await Student.create(obj);
    res.json(s);
  }catch(err){
    res.status(400).json({error: err.message});
  }
});

// list students
router.get('/students', async (req,res)=>{
  const rows = await Student.find().lean();
  res.json(rows);
});

// view student recharges
router.get('/students/:id/recharges', async (req,res)=>{
  const r = await Recharge.find({studentId: req.params.id}).sort({created_at:-1}).lean();
  res.json(r);
});

module.exports = router;
