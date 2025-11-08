const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const Recharge = require('../models/Recharge');
const Student = require('../models/Student');
const smePay = require('../utils/smePay');

// create payment (initiate) - server-side creates order with SMEPay and returns provider response (slug)
router.post('/create', async (req,res)=>{
  try{
    console.log('📥 Incoming recharge request:', JSON.stringify(req.body, null, 2));
    const { studentId, amount_cents, customer } = req.body;
    if(!studentId || !amount_cents) return res.status(400).json({error:'missing'});
    const order_id = `EXT-${Date.now()}`;
    // SMEPay requires a callback URL. For local dev, this won't be reachable by SMEPay's servers,
    // but it is required to pass validation. In production, this should be a public URL.
    const callback_url = req.body.callback_url || `${req.protocol}://${req.get('host')}/api/recharge/webhook`;
    console.log('🔗 Callback URL:', callback_url);
    const provider = await smePay.createOrder({
      studentId,
      amount_cents,
      order_id,
      callback_url,
      customer_details: customer || {}
    });
    console.log('✅ Provider response received:', JSON.stringify(provider, null, 2));
    // provider may return order_slug or slug or order_id
    const provider_txn = provider.order_id || provider.orderId || provider.slug || provider.order_slug || uuidv4();
    const slug = provider.order_slug || provider.slug || null;
    console.log('🎫 Extracted slug:', slug);
    console.log('🆔 Extracted provider_txn:', provider_txn);
    const r = await Recharge.create({
      studentId,
      amount_cents,
      status: (provider.payment_status || provider.status || 'created'),
      provider_txn,
      provider_payload: provider,
      created_at: new Date()
    });
    console.log('💾 Recharge record saved:', r._id);
    res.json({ok:true, recharge: r, provider: { provider_txn, slug, raw: provider } });
  }catch(err){
    console.error('❌ Error in /create:', err);
    res.status(500).json({error: err.message});
  }
});

// verify/check payment (client polls this after widget success)
router.post('/verify', async (req,res)=>{
  console.log('🔍 Verify request received:', JSON.stringify(req.body, null, 2));
  const { provider_txn, slug, order_id } = req.body;
  if(!provider_txn && !slug && !order_id) return res.status(400).json({error:'missing'});
  try{
    const provider = await smePay.checkStatus({ order_id, slug, ref_id: provider_txn });
    console.log('📊 Status check result:', JSON.stringify(provider, null, 2));
    // find recharge
    const query = {};
    if(provider_txn) query.provider_txn = provider_txn;
    if(slug) query['provider_payload.order_slug'] = slug;
    if(order_id) query['provider_payload.order_id'] = order_id;
    console.log('🔎 Looking for recharge with query:', JSON.stringify(query, null, 2));
    const r = await Recharge.findOne(query);
    if(!r) {
      console.log('❌ Recharge not found');
      return res.status(404).json({error:'not found'});
    }
    console.log('✅ Recharge found:', r._id);
    r.status = provider.payment_status || provider.status || r.status;
    r.provider_payload = provider;
    await r.save();
    console.log('💾 Recharge updated with status:', r.status);
    if(r.status && (r.status.toUpperCase() === 'SUCCESS' || r.status.toUpperCase()==='PAID' || r.status.toUpperCase()==='COMPLETED')){
      console.log('💰 Payment successful! Updating student balance');
      await Student.updateOne({studentId: r.studentId}, { $inc: { balance_cents: r.amount_cents } });
    }
    res.json({ok:true, status: r.status, provider});
  }catch(err){
    console.error('❌ Error in /verify:', err);
    res.status(500).json({error:err.message});
  }
});

// webhook endpoint for provider to call (recommended).
router.post('/webhook', async (req,res)=>{
  console.log('🔔 Webhook received:', JSON.stringify(req.body, null, 2));
  const payload = req.body || {};
  // New webhook format: { ref_id, transaction_id, status, processed_at, created_at, amount }
  const ref_id = payload.ref_id; // Our external order_id (EXT-xxx)
  const transaction_id = payload.transaction_id; // SME Pay's internal transaction ID (slug)
  const status = payload.status || payload.payment_status;
  const amount = payload.amount;
  console.log('🆔 Webhook - ref_id:', ref_id, 'transaction_id:', transaction_id, 'status:', status, 'amount:', amount);
  try{
    // find recharge by ref_id (our external order_id) or transaction_id (slug)
    let r = null;
    if(ref_id){
      // ref_id matches our order_id field in provider_payload
      r = await Recharge.findOne({ 'provider_payload.ref_id': ref_id });
    }
    if(!r && transaction_id){
      // transaction_id is the slug
      r = await Recharge.findOne({ 'provider_payload.order_slug': transaction_id }) 
        || await Recharge.findOne({ 'provider_payload.slug': transaction_id });
    }
    if(!r){
      console.log('⚠️ No matching recharge found for webhook');
      // nothing to update
      return res.json({ok:true, message:'no matching recharge'});
    }
    console.log('✅ Recharge found for webhook:', r._id);
    r.status = status || r.status || 'unknown';
    r.provider_payload = { ...r.provider_payload, ...payload }; // Merge webhook data
    await r.save();
    console.log('💾 Recharge updated via webhook with status:', r.status);
    if(r.status && (r.status.toUpperCase()==='SUCCESS' || r.status.toUpperCase()==='PAID' || r.status.toUpperCase()==='COMPLETED')){
      console.log('💰 Payment successful via webhook! Updating student balance');
      await Student.updateOne({studentId: r.studentId}, { $inc: { balance_cents: r.amount_cents } });
    }
    res.json({ok:true});
  }catch(err){
    console.error('❌ Error in /webhook:', err);
    res.status(500).json({error:err.message});
  }
});

module.exports = router;
