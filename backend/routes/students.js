const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const CallHistory = require('../models/CallHistory');
const Recharge = require('../models/Recharge');

// get student info
router.get('/:id', async (req,res)=>{
  const s = await Student.findOne({studentId: req.params.id}).lean();
  if(!s) return res.status(404).json({error:'not found'});
  const calls = await CallHistory.find({studentId: s.studentId}).sort({started_at:-1}).limit(50).lean();
  const recharges = await Recharge.find({studentId: s.studentId}).sort({created_at:-1}).limit(20).lean();
  res.json({student: s, calls, recharges});
});

module.exports = router;
