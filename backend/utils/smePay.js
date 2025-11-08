/*
SMEPay helper (staging/test environment).
Flow implemented from SMEPay docs:
- Auth: POST /api/wiz/external/auth  -> client_id + client_secret (returns token)
- Create Order: POST /api/wiz/external/order/create  (Bearer token)
- Check Status: POST /api/external/order/status (NEW endpoint)
- Validate Order: POST /api/external/order/validate

This module attempts to obtain a temporary bearer token via Auth, caches it in-memory for reuse.
Replace or extend error handling as needed.
*/
const axios = require('axios');

const API_BASE = process.env.SMEPAY_API_URL || 'https://staging.smepay.in/api';
const CLIENT_ID = process.env.SMEPAY_CLIENT_ID || '';
const CLIENT_SECRET = process.env.SMEPAY_CLIENT_SECRET || '';

let tokenCache = { token: null, expiry: 0 };

async function getAuthToken(){
  // If cached and not expired, return
  if(tokenCache.token && Date.now() < tokenCache.expiry - 10000) return tokenCache.token;
  try{
    const url = `${API_BASE}/wiz/external/auth`;
    console.log('🔍 Attempting auth with URL:', url);
    console.log('🔍 Client ID:', CLIENT_ID);
    console.log('🔍 API Base:', API_BASE);
    const res = await axios.post(url, { client_id: CLIENT_ID, client_secret: CLIENT_SECRET }, { validateStatus: ()=>true });
    console.log('📡 Auth Response Status:', res.status);
    console.log('📡 Auth Response Data:', JSON.stringify(res.data, null, 2));
    // Docs show odd response for auth (may not return body). Try multiple strategies:
    if(res.data && (res.data.access_token || res.data.token)) {
      const tok = res.data.access_token || res.data.token;
      tokenCache = { token: tok, expiry: Date.now() + (60*60*1000) }; // 1 hour
      return tok;
    }
    // some implementations return token in headers or different key; check common keys:
    if(res.headers && (res.headers['authorization'] || res.headers['x-access-token'])) {
      const tok = res.headers['authorization'] || res.headers['x-access-token'];
      tokenCache = { token: tok.replace(/^Bearer\s*/i,''), expiry: Date.now() + (60*60*1000) };
      return tokenCache.token;
    }
    // If we are here, no token was found in the response body or headers.
    // Throw an error instead of failing silently.
    throw new Error('Could not extract auth token from SMEPay response. Response data: ' + JSON.stringify(res.data));
  }catch(err){
    console.error('SMEPay auth error:', err.message);
    // Re-throw the error to be caught by the calling function
    throw err;
  }
}

async function createOrder({studentId, amount_cents, order_id, callback_url, customer_details={}}){
  const token = await getAuthToken();
  const url = `${API_BASE}/wiz/external/order/create`;
  const payload = {
    client_id: CLIENT_ID,
    amount: (amount_cents/100).toString(), // docs expect amount as string numeric
    order_id: order_id || `ORD-${Date.now()}`,
    callback_url: callback_url || '',
    customer_details: customer_details || {}
  };
  console.log('🔍 Creating order with URL:', url);
  console.log('🔍 Order Payload:', JSON.stringify(payload, null, 2));
  const headers = { 'Content-Type': 'application/json' };
  if(token) headers['Authorization'] = `Bearer ${token}`;
  const res = await axios.post(url, payload, { headers, validateStatus: ()=>true });
  console.log('📡 Create Order Response Status:', res.status);
  console.log('📡 Create Order Response Data:', JSON.stringify(res.data, null, 2));
  // return raw response for caller to interpret (slug may be in res.data.order_slug or res.data.slug)
  return res.data || {};
}

async function checkStatus({ order_id, slug, ref_id }){
  const token = await getAuthToken();
  // Updated endpoint to match SME Pay documentation
  const url = `${API_BASE}/external/order/status`;
  const payload = {
    client_id: CLIENT_ID  // Required by SME Pay API
  };
  // According to docs, can use order_id, slug, or ref_id
  if(order_id) payload.order_id = order_id;
  if(slug) payload.slug = slug;
  if(ref_id) payload.ref_id = ref_id;
  console.log('🔍 Checking status with URL:', url);
  console.log('🔍 Status Payload:', JSON.stringify(payload, null, 2));
  const headers = { 'Content-Type':'application/json' };
  if(token) headers['Authorization'] = `Bearer ${token}`;
  const res = await axios.post(url, payload, { headers, validateStatus: ()=>true });
  console.log('📡 Check Status Response Status:', res.status);
  console.log('📡 Check Status Response Data:', JSON.stringify(res.data, null, 2));
  // Map response to expected format
  // Response format: { status, order_id, payment_status, amount, provider, created_at, processed_at }
  if(res.data && res.data.payment_status) {
    return {
      ...res.data,
      status: res.data.payment_status // Ensure backward compatibility
    };
  }
  return res.data || {};
}

async function validateOrder({ amount_cents, slug }){
  const token = await getAuthToken();
  // Updated endpoint to match SME Pay documentation
  const url = `${API_BASE}/external/order/validate`;
  const payload = {
    client_id: CLIENT_ID,
    amount: (amount_cents/100), // Numeric amount (not string)
    slug: slug
  };
  console.log('🔍 Validating order with URL:', url);
  console.log('🔍 Validate Payload:', JSON.stringify(payload, null, 2));
  const headers = { 'Content-Type':'application/json' };
  if(token) headers['Authorization'] = `Bearer ${token}`;
  const res = await axios.post(url, payload, { headers, validateStatus: ()=>true });
  console.log('📡 Validate Order Response Status:', res.status);
  console.log('📡 Validate Order Response Data:', JSON.stringify(res.data, null, 2));
  return res.data || {};
}

module.exports = { getAuthToken, createOrder, checkStatus, validateOrder };
