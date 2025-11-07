require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const studentRoutes = require('./routes/students');
const rechargeRoutes = require('./routes/recharge');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// connect mongodb
const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/hostelapp';
mongoose.connect(MONGO, {useNewUrlParser:true, useUnifiedTopology:true})
  .then(()=>console.log('MongoDB connected'))
  .catch(err=>console.error('Mongo connect error',err));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/recharge', rechargeRoutes);

app.get('/', (req,res)=>res.json({ok:true}));

// ensure default admin exists
const AdminUser = require('./models/AdminUser');
AdminUser.ensureDefault().catch(console.error);

const PORT = process.env.PORT || 4500;
app.listen(PORT, ()=>console.log('Server running on',PORT));
