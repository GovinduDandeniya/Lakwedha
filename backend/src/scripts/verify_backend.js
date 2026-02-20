const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const mongoose = require('mongoose');
const Prescription = require('../models/Prescription');
const User = require('../models/user'); // Ensure correct casing, list_dir showed user.js
const { PRESCRIPTION_STATUS } = require('../config/constants');

const BASE_URL = 'http://127.0.0.1:5000/api';
let token = '';
let userId = '';
let prescriptionId = '';
let orderId = '';

const TEST_USER = {
    name: 'Test User',
    email: 'testuser' + Date.now() + '@example.com',
    password: 'password123'
};

async function runTests() {
    try {
        console.log('--- Starting Backend Tests ---');

        // 1. Connect DB to seed data
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB for seeding');

        // 2. Register/Login User
        console.log(`\n--- Only Login (Registering ${TEST_USER.email}) ---`);
        const registerRes = await fetch(`${BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(TEST_USER)
        });

        if (registerRes.status === 201) {
             console.log('User registered');
        } else {
             console.log('User registration failed/exists:', await registerRes.json());
        }

        const loginRes = await fetch(`${BASE_URL}/users/login`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ email: TEST_USER.email, password: TEST_USER.password })
        });

        if (!loginRes.ok) throw new Error('Login failed');
        const loginData = await loginRes.json();
        token = loginData.token;
        userId = loginData.user.id;
        console.log('Logged in, token received');

        // 3. Create Dummy Prescription
        const prescription = await Prescription.create({
            userId: userId,
            imageUrl: 'http://test.com/img.jpg',
            doctorStatus: 'pending',
            pharmacyStatus: 'pending',
            medicines: [], // Start empty
            pharmacyNote: 'Test note'
        });
        prescriptionId = prescription._id.toString();
        console.log(`Created prescription: ${prescriptionId}`);

        // Disconnect Mongoose to avoid hanging process, but keep server running
        // Actually, we don't need to disconnect if we just exit at the end.

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        // 4. Test GET /pharmacy/prescriptions
        console.log('\n--- GET /pharmacy/prescriptions ---');
        const getPresRes = await fetch(`${BASE_URL}/pharmacy/prescriptions`, { headers });
        const prescriptions = await getPresRes.json();
        console.log(`Status: ${getPresRes.status}, Found: ${prescriptions.length} prescriptions`);
        if (!prescriptions.find(p => p._id === prescriptionId)) throw new Error('Prescription not found in list');

        // 5. Test PUT /pharmacy/prescriptions/:id/medicines
        console.log('\n--- PUT /pharmacy/prescriptions/:id/medicines ---');
        const updateMedsRes = await fetch(`${BASE_URL}/pharmacy/prescriptions/${prescriptionId}/medicines`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({
                medicines: [
                    { name: 'Test Med A', quantity: 2, price: 100 },
                    { name: 'Test Med B', quantity: 1, price: 50 }
                ]
            })
        });
        const updatedMedsData = await updateMedsRes.json();
        console.log(`Status: ${updateMedsRes.status}, Message: ${updatedMedsData.message}`);
        if (updateMedsRes.status !== 200) throw new Error('Failed to update medicines');

        // 6. Test PUT /pharmacy/prescriptions/:id/review (Approve)
        console.log('\n--- PUT /pharmacy/prescriptions/:id/review ---');
        const reviewRes = await fetch(`${BASE_URL}/pharmacy/prescriptions/${prescriptionId}/review`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ action: 'approve' })
        });
        const reviewData = await reviewRes.json();
        console.log(`Status: ${reviewRes.status}, Message: ${reviewData.message}`);
        if (reviewRes.status !== 200) throw new Error('Failed to approve prescription');

        // 7. Test POST /orders/from-prescription/:id
        console.log('\n--- POST /orders/from-prescription/:id ---');
        const createOrderRes = await fetch(`${BASE_URL}/orders/from-prescription/${prescriptionId}`, {
            method: 'POST',
            headers
        });
        const orderData = await createOrderRes.json();
        console.log(`Status: ${createOrderRes.status}, Message: ${orderData.message}`);
        if (createOrderRes.status !== 201) throw new Error('Failed to create order: ' + JSON.stringify(orderData));

        orderId = orderData.order._id;
        console.log(`Order Created: ${orderId}`);
        console.log(`Total Amount: ${orderData.order.totalAmount} (Expected: (200+50) + 200 + 25 = 475)`);

        // 8. Test PUT /orders/:id/status
        console.log('\n--- PUT /orders/:id/status ---');
        const updateStatusRes = await fetch(`${BASE_URL}/orders/${orderId}/status`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ status: 'processing' })
        });
        const statusData = await updateStatusRes.json();
        console.log(`Status: ${updateStatusRes.status}, New Status: ${statusData.order.status}`);
        if (updateStatusRes.status !== 200) throw new Error('Failed to update status');

        // 9. Test PUT /orders/:id/payment
        console.log('\n--- PUT /orders/:id/payment ---');
        const updatePaymentRes = await fetch(`${BASE_URL}/orders/${orderId}/payment`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ paymentStatus: 'paid' })
        });
        const paymentData = await updatePaymentRes.json();
        console.log(`Status: ${updatePaymentRes.status}, New Payment Status: ${paymentData.order.paymentStatus}`);
        if (updatePaymentRes.status !== 200) throw new Error('Failed to update payment');

        console.log('\n--- ALL TESTS PASSED SUCCESSFULLY ---');
        process.exit(0);

    } catch (err) {
        console.error('\n!!! TEST FAILED !!!');
        console.error(err);
        process.exit(1);
    }
}

runTests();
