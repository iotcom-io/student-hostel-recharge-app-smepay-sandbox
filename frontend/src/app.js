// Configuration
// Dynamically use the same domain as frontend, or fallback to recharge.iotcom.io
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:4500/api'  // Local development
    : `${window.location.protocol}//${window.location.hostname}/api`;  // Production (same domain)

const SMEPAY_WIDGET_URL = 'https://extranet.smepay.in/payment/widget';

// State management
let currentUser = {
    role: null,
    token: null,
    data: null
};

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

function initializeApp() {
    // Check for existing session
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (token && role) {
        currentUser.token = token;
        currentUser.role = role;
        if (role === 'admin') {
            showAdminDashboard();
        } else {
            showStudentDashboard();
        }
    } else {
        showLoginScreen();
    }
    
    // Setup event listeners
    setupLoginListeners();
    setupAdminListeners();
    setupStudentListeners();
}

// ==================== LOGIN SCREEN ====================
function setupLoginListeners() {
    // Role toggle
    document.querySelectorAll('.role-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            const role = e.target.dataset.role;
            const label = document.getElementById('username-label');
            label.textContent = role === 'admin' ? 'Username' : 'Student ID';
        });
    });
    
    // Login form
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleLogin();
    });
}

async function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const role = document.querySelector('.role-btn.active').dataset.role;
    const errorMsg = document.getElementById('error-msg');
    
    errorMsg.textContent = '';
    
    try {
        const endpoint = role === 'admin' ? '/auth/admin/login' : '/auth/student/login';
        const body = role === 'admin' 
            ? { username, password }
            : { studentId: username, password };
        
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Store credentials
        currentUser.token = data.token;
        currentUser.role = role;
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', role);
        
        if (role === 'admin') {
            localStorage.setItem('username', username);
            showAdminDashboard();
        } else {
            localStorage.setItem('studentId', username);
            showStudentDashboard();
        }
        
    } catch (error) {
        errorMsg.textContent = '❌ ' + (error.message || 'Invalid credentials');
    }
}

function showLoginScreen() {
    hideAllScreens();
    document.getElementById('login-screen').classList.add('active');
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
    document.getElementById('error-msg').textContent = '';
}

// ==================== ADMIN DASHBOARD ====================
function setupAdminListeners() {
    // Add parent button
    document.getElementById('add-parent-btn').addEventListener('click', addParentField);
    
    // Add student form
    document.getElementById('add-student-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleAddStudent();
    });
    
    // Logout
    document.getElementById('logout-btn').addEventListener('click', logout);
}

function addParentField() {
    const container = document.getElementById('parents-container');
    const entry = document.createElement('div');
    entry.className = 'parent-entry';
    entry.innerHTML = `
        <div class="form-row">
            <div class="form-group">
                <label>Parent Name</label>
                <input type="text" class="parent-name" placeholder="Parent/Guardian name">
            </div>
            <div class="form-group">
                <label>Phone Number (Allowed for calls)</label>
                <input type="tel" class="parent-phone" placeholder="+91xxxxxxxxxx">
            </div>
        </div>
    `;
    container.appendChild(entry);
}

async function handleAddStudent() {
    const studentId = document.getElementById('new-student-id').value;
    const name = document.getElementById('new-student-name').value;
    const room = document.getElementById('new-student-room').value;
    const password = document.getElementById('new-student-password').value;
    const errorMsg = document.getElementById('add-error-msg');
    
    // Collect parents
    const parents = [];
    document.querySelectorAll('.parent-entry').forEach(entry => {
        const parentName = entry.querySelector('.parent-name').value;
        const parentPhone = entry.querySelector('.parent-phone').value;
        if (parentName && parentPhone) {
            parents.push({ name: parentName, phone: parentPhone });
        }
    });
    
    errorMsg.textContent = '';
    
    try {
        const response = await fetch(`${API_BASE}/admin/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ studentId, name, room, password, parents })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to add student');
        }
        
        // Reset form
        document.getElementById('add-student-form').reset();
        document.getElementById('parents-container').innerHTML = `
            <div class="parent-entry">
                <div class="form-row">
                    <div class="form-group">
                        <label>Parent Name</label>
                        <input type="text" class="parent-name" placeholder="Parent/Guardian name">
                    </div>
                    <div class="form-group">
                        <label>Phone Number (Allowed for calls)</label>
                        <input type="tel" class="parent-phone" placeholder="+91xxxxxxxxxx">
                    </div>
                </div>
            </div>
        `;
        
        // Show success message
        errorMsg.textContent = '✅ Student added successfully!';
        errorMsg.style.color = '#28a745';
        
        setTimeout(() => {
            errorMsg.textContent = '';
            errorMsg.style.color = '';
        }, 3000);
        
        // Refresh students list
        loadStudentsList();
        
    } catch (error) {
        errorMsg.textContent = '❌ ' + (error.message || 'Failed to add student');
    }
}

async function showAdminDashboard() {
    hideAllScreens();
    document.getElementById('admin-screen').classList.add('active');
    
    const username = localStorage.getItem('username') || 'Admin';
    document.getElementById('admin-user').textContent = `Logged in as: ${username}`;
    
    await loadStudentsList();
}

async function loadStudentsList() {
    try {
        const response = await fetch(`${API_BASE}/admin/students`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const students = await response.json();
        
        const container = document.getElementById('students-list');
        
        if (students.length === 0) {
            container.innerHTML = '<p class="no-data">No students added yet.</p>';
            return;
        }
        
        container.innerHTML = students.map(student => `
            <div class="student-card">
                <h4>${student.name}</h4>
                <p><strong>ID:</strong> ${student.studentId}</p>
                <p><strong>Room:</strong> ${student.room}</p>
                <p><strong>Balance:</strong> ₹${(student.balance_cents / 100).toFixed(2)}</p>
                <p><strong>Parents:</strong> ${student.parents.length}</p>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Failed to load students:', error);
    }
}

// ==================== STUDENT DASHBOARD ====================
function setupStudentListeners() {
    document.getElementById('student-logout-btn').addEventListener('click', logout);
    document.getElementById('recharge-btn').addEventListener('click', openRechargeModal);
    document.getElementById('modal-close').addEventListener('click', closeRechargeModal);
    document.getElementById('recharge-modal').addEventListener('click', (e) => {
        if (e.target.id === 'recharge-modal') closeRechargeModal();
    });
    document.getElementById('recharge-form').addEventListener('submit', handleRecharge);
}

async function showStudentDashboard() {
    hideAllScreens();
    document.getElementById('student-screen').classList.add('active');
    
    const studentId = localStorage.getItem('studentId');
    await loadStudentData(studentId);
}

async function loadStudentData(studentId) {
    try {
        const response = await fetch(`${API_BASE}/students/${studentId}`, {
            headers: {
                'Authorization': `Bearer ${currentUser.token}`
            }
        });
        
        const data = await response.json();
        currentUser.data = data;
        
        // Update header
        document.getElementById('student-name').textContent = `Welcome, ${data.student.name}`;
        document.getElementById('student-details').textContent = `ID: ${data.student.studentId} | Room: ${data.student.room}`;
        
        // Update balance
        const balance = (data.student.balance_cents / 100).toFixed(2);
        document.getElementById('balance-amount').textContent = `₹${balance}`;
        
        // Update info section
        document.getElementById('info-student-id').textContent = data.student.studentId;
        document.getElementById('info-name').textContent = data.student.name;
        document.getElementById('info-room').textContent = data.student.room;
        
        // Update parents list
        const parentsList = document.getElementById('parents-list');
        if (data.student.parents && data.student.parents.length > 0) {
            parentsList.innerHTML = data.student.parents.map(parent => `
                <div class="parent-card">
                    <div class="parent-name">${parent.name}</div>
                    <div class="parent-phone">📱 ${parent.phone}</div>
                </div>
            `).join('');
        } else {
            parentsList.innerHTML = '<p class="no-data">No parent contacts added.</p>';
        }
        
        // Update recharge history
        const rechargeHistory = document.getElementById('recharge-history');
        if (data.recharges && data.recharges.length > 0) {
            rechargeHistory.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Transaction ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.recharges.map(r => `
                            <tr>
                                <td>${new Date(r.created_at).toLocaleDateString()}</td>
                                <td>₹${(r.amount_cents / 100).toFixed(2)}</td>
                                <td><span class="status status-${r.status.toLowerCase()}">${r.status}</span></td>
                                <td>${r.provider_txn || 'N/A'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            rechargeHistory.innerHTML = '<p class="no-data">No recharge history yet.</p>';
        }
        
        // Update call history
        const callHistory = document.getElementById('call-history');
        if (data.calls && data.calls.length > 0) {
            callHistory.innerHTML = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Date & Time</th>
                            <th>To Number</th>
                            <th>Duration</th>
                            <th>Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.calls.map(call => `
                            <tr>
                                <td>${new Date(call.started_at).toLocaleString()}</td>
                                <td>${call.to_number || 'N/A'}</td>
                                <td>${call.duration_seconds ? Math.floor(call.duration_seconds / 60) + 'm ' + (call.duration_seconds % 60) + 's' : 'N/A'}</td>
                                <td>₹${call.cost_cents ? (call.cost_cents / 100).toFixed(2) : '0.00'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            callHistory.innerHTML = '<p class="no-data">No call history yet.</p>';
        }
        
    } catch (error) {
        console.error('Failed to load student data:', error);
    }
}

// ==================== RECHARGE FUNCTIONALITY ====================
function openRechargeModal() {
    document.getElementById('recharge-modal').classList.add('active');
    document.getElementById('recharge-error-msg').textContent = '';
    document.getElementById('payment-status').innerHTML = '';
}

function closeRechargeModal() {
    document.getElementById('recharge-modal').classList.remove('active');
    document.getElementById('recharge-form').reset();
}

async function handleRecharge(e) {
    e.preventDefault();
    
    const amount_cents = parseInt(document.getElementById('recharge-amount').value);
    const studentId = localStorage.getItem('studentId');
    const errorMsg = document.getElementById('recharge-error-msg');
    const statusDiv = document.getElementById('payment-status');
    
    errorMsg.textContent = '';
    statusDiv.innerHTML = '<div class="loading">Processing...</div>';
    
    try {
        // Step 1: Create order with backend
        const response = await fetch(`${API_BASE}/recharge/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({
                studentId,
                amount_cents,
                callback_url: `${window.location.origin}/payment-callback`,
                customer: {
                    name: currentUser.data?.student?.name || studentId,
                    email: `${studentId}@hostel.edu`,
                    phone: currentUser.data?.student?.parents?.[0]?.phone || ''
                }
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create order');
        }
        
        const slug = data.provider?.slug;
        const provider_txn = data.provider?.provider_txn;
        const payment_url = data.provider?.raw?.payment_url || data.provider?.payment_url;
        
        if (!slug) {
            throw new Error('No payment slug received from gateway');
        }
        
        // Step 2: Launch SMEPay Checkout Widget
        statusDiv.innerHTML = `
            <div class="payment-info">
                <p>✅ Order created successfully!</p>
                <p><strong>Transaction ID:</strong> ${provider_txn}</p>
                <p>Opening payment gateway...</p>
            </div>
        `;
        
        // Use SMEPay checkout widget
        if (window.smepayCheckout) {
            window.smepayCheckout({
                slug: slug,
                onSuccess: (widgetData) => {
                    console.log("✅ Payment successful:", widgetData);
                    statusDiv.innerHTML = '<div class="loading">Verifying payment...</div>';
                    // Auto-verify payment after success
                    verifyPayment(provider_txn, slug);
                },
                onFailure: () => {
                    console.log("❌ Payment failed or closed.");
                    statusDiv.innerHTML = `
                        <div class="payment-failed">
                            <p>❌ Payment was cancelled or failed.</p>
                            <button onclick="verifyPayment('${provider_txn}', '${slug}')" class="btn btn-secondary">
                                Check Payment Status
                            </button>
                        </div>
                    `;
                }
            });
        } else {
            // Fallback: Open payment URL in new window if widget not loaded
            console.warn('SMEPay widget not loaded, using fallback');
            const paymentLink = payment_url || `${SMEPAY_WIDGET_URL}/${slug}`;
            statusDiv.innerHTML = `
                <div class="payment-info">
                    <p>✅ Order created successfully!</p>
                    <p><strong>Transaction ID:</strong> ${provider_txn}</p>
                    <a href="${paymentLink}" target="_blank" class="btn btn-primary">
                        Complete Payment on SME Pay
                    </a>
                    <p class="payment-note">After payment, click "Verify Payment" below</p>
                    <button onclick="verifyPayment('${provider_txn}', '${slug}')" class="btn btn-secondary">
                        Verify Payment
                    </button>
                </div>
            `;
            window.open(paymentLink, '_blank', 'width=800,height=600');
        }
        
    } catch (error) {
        errorMsg.textContent = '❌ ' + (error.message || 'Failed to initiate recharge');
        statusDiv.innerHTML = '';
    }
}

async function verifyPayment(provider_txn, slug) {
    const statusDiv = document.getElementById('payment-status');
    const errorMsg = document.getElementById('recharge-error-msg');
    
    statusDiv.innerHTML = '<div class="loading">Verifying payment...</div>';
    errorMsg.textContent = '';
    
    try {
        const response = await fetch(`${API_BASE}/recharge/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${currentUser.token}`
            },
            body: JSON.stringify({ provider_txn, slug })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Verification failed');
        }
        
        const status = data.status?.toUpperCase();
        
        if (status === 'SUCCESS' || status === 'PAID' || status === 'COMPLETED') {
            statusDiv.innerHTML = `
                <div class="payment-success">
                    <h3>✅ Payment Successful!</h3>
                    <p>Your account has been recharged.</p>
                </div>
            `;
            
            // Reload student data to show updated balance
            setTimeout(() => {
                closeRechargeModal();
                const studentId = localStorage.getItem('studentId');
                loadStudentData(studentId);
            }, 2000);
        } else if (status === 'PENDING' || status === 'CREATED') {
            statusDiv.innerHTML = `
                <div class="payment-pending">
                    <p>⏳ Payment is pending. Please wait...</p>
                    <button onclick="verifyPayment('${provider_txn}', '${slug}')" class="btn btn-secondary">
                        Check Again
                    </button>
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="payment-failed">
                    <p>❌ Payment failed or cancelled.</p>
                    <p>Status: ${status}</p>
                </div>
            `;
        }
        
    } catch (error) {
        errorMsg.textContent = '❌ ' + (error.message || 'Failed to verify payment');
        statusDiv.innerHTML = '';
    }
}

// Make verifyPayment available globally
window.verifyPayment = verifyPayment;

// ==================== UTILITY FUNCTIONS ====================
function hideAllScreens() {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
}

function logout() {
    localStorage.clear();
    currentUser = { role: null, token: null, data: null };
    showLoginScreen();
}
