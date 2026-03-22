const PharmacyRequest       = require('../models/PharmacyRequest');
const Pharmacy              = require('../models/pharmacy.model');
const User                  = require('../models/user');
const Notification          = require('../models/Notification');
const asyncHandler          = require('../utils/asyncHandler');
const { sendPushNotification } = require('../utils/sendNotification');
const { sendSMS }           = require('../services/smsService');

// ── Patient: Submit prescription request to one or more pharmacies ─────────────
exports.createRequest = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
    }

    const { pharmacies, patientDetails, prescriptionFileUrl, location } = req.body;

    if (!pharmacies || !Array.isArray(pharmacies) || pharmacies.length === 0) {
        return res.status(400).json({ success: false, message: 'Select at least one pharmacy.' });
    }
    if (!patientDetails?.firstName || !patientDetails?.lastName ||
        !patientDetails?.address   || !patientDetails?.mobile) {
        return res.status(400).json({ success: false, message: 'All patient details are required.' });
    }
    if (!prescriptionFileUrl) {
        return res.status(400).json({ success: false, message: 'Prescription file is required.' });
    }

    // Validate all pharmacy IDs exist
    const found = await Pharmacy.countDocuments({ _id: { $in: pharmacies }, status: 'approved' });
    if (found !== pharmacies.length) {
        return res.status(400).json({ success: false, message: 'One or more pharmacy IDs are invalid.' });
    }

    // Create one request per pharmacy
    const docs = pharmacies.map((pharmacyId) => ({
        userId,
        pharmacyId,
        patientDetails,
        prescriptionFileUrl,
        location: location || {},
        status: 'pending',
    }));

    const created = await PharmacyRequest.insertMany(docs);

    res.status(201).json({
        success: true,
        data: created,
        message: `Prescription request submitted to ${created.length} pharmacy(s).`,
    });
});

// ── Pharmacy: Get requests assigned to this pharmacy ──────────────────────────
exports.getPharmacyRequests = asyncHandler(async (req, res) => {
    const pharmacyId = req.user?.id;
    const { status } = req.query;

    const filter = { pharmacyId };
    if (status) filter.status = status;

    const requests = await PharmacyRequest.find(filter)
        .sort({ createdAt: -1 })
        .lean();

    res.json({ success: true, data: requests, message: 'Requests fetched.' });
});

// ── Pharmacy: Approve (with price) or reject a request ───────────────────────
exports.respondToRequest = asyncHandler(async (req, res) => {
    const pharmacyId = req.user?.id;
    const { requestId, status, price, reason } = req.body;

    if (!requestId) {
        return res.status(400).json({ success: false, message: 'requestId is required.' });
    }
    if (!['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ success: false, message: 'status must be "approved" or "rejected".' });
    }

    const request = await PharmacyRequest.findOne({ _id: requestId, pharmacyId });
    if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status !== 'pending') {
        return res.status(400).json({ success: false, message: `Request already ${request.status}.` });
    }

    if (status === 'rejected') {
        if (!reason || reason.trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Rejection reason (min 5 chars) is required.' });
        }
        request.status = 'rejected';
        request.rejectionReason = reason.trim();
    } else {
        if (!price || Number(price) <= 0) {
            return res.status(400).json({ success: false, message: 'A valid price is required for approval.' });
        }
        request.status = 'price_sent';
        request.price = Number(price);
    }

    await request.save();

    // ── Notify patient when pharmacy approves with a price ────────────────────
    if (status !== 'rejected') {
        try {
            const [patient, pharmacy] = await Promise.all([
                User.findById(request.userId).select('fcmToken phone name first_name'),
                Pharmacy.findById(pharmacyId).select('pharmacyName').lean(),
            ]);
            const pharmacyName = pharmacy?.pharmacyName || 'The pharmacy';
            const title   = 'Your Order Price is Ready 💊';
            const message = `${pharmacyName} reviewed your prescription and set a price of LKR ${request.price}. Open the app to pay and confirm your order.`;

            // Persist notification in DB
            await Notification.create({
                userId:  request.userId,
                title,
                message,
                type: 'PHARMACY_PRICE_SENT',
            });

            // Push notification
            if (patient?.fcmToken) {
                await sendPushNotification(patient.fcmToken, title, message);
            }

            // SMS
            if (patient?.phone) {
                const smsText =
                    `Lakwedha Pharmacy 💊\n` +
                    `${pharmacyName} has set a price for your prescription.\n` +
                    `Amount: LKR ${request.price}\n` +
                    `Login to the app to pay and confirm your order.`;
                await sendSMS(patient.phone, smsText);
            }
        } catch (notifyErr) {
            console.error('[PharmacyRequest] Price-sent notification error:', notifyErr.message);
        }
    }

    res.json({ success: true, data: request, message: `Request ${status === 'rejected' ? 'rejected' : 'approved with price'}.` });
});

// ── Patient: Get own requests ─────────────────────────────────────────────────
exports.getUserRequests = asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    const requests = await PharmacyRequest.find({ userId })
        .sort({ createdAt: -1 })
        .lean();

    // Enrich with pharmacy name
    const pharmacyIds = [...new Set(requests.map((r) => r.pharmacyId.toString()))];
    const pharmacies  = await Pharmacy.find({ _id: { $in: pharmacyIds } })
        .select('pharmacyName address phone')
        .lean();
    const pharmacyMap = {};
    pharmacies.forEach((p) => { pharmacyMap[p._id.toString()] = p; });

    const enriched = requests.map((r) => ({
        ...r,
        pharmacy: pharmacyMap[r.pharmacyId.toString()] || null,
    }));

    res.json({ success: true, data: enriched, message: 'User requests fetched.' });
});

// ── Patient: Pay for an approved request ─────────────────────────────────────
exports.payForRequest = asyncHandler(async (req, res) => {
    const userId    = req.user?.id;
    const { requestId } = req.body;

    if (!requestId) {
        return res.status(400).json({ success: false, message: 'requestId is required.' });
    }

    const request = await PharmacyRequest.findOne({ _id: requestId, userId });
    if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status !== 'price_sent') {
        return res.status(400).json({ success: false, message: 'Request is not awaiting payment.' });
    }

    request.status        = 'paid';
    request.paymentStatus = 'paid';
    request.paidAt        = new Date();
    await request.save();

    // ── Notify pharmacy admin that payment was received ───────────────────────
    try {
        const [pharmacyUser, patient] = await Promise.all([
            User.findById(request.pharmacyId).select('fcmToken'),
            User.findById(userId).select('fcmToken phone first_name name'),
        ]);

        const patientName = patient?.first_name || patient?.name || 'A patient';

        // Push to pharmacy admin
        if (pharmacyUser?.fcmToken) {
            await sendPushNotification(
                pharmacyUser.fcmToken,
                'Payment Received — New Order 💰',
                `${patientName} paid LKR ${request.price} for their prescription. Please process the order.`
            );
        }

        // Save payment confirmation notification for the user
        await Notification.create({
            userId,
            title:   'Payment Confirmed 🎉',
            message: `Your payment of LKR ${request.price} was received. The pharmacy will now process your order.`,
            type:    'PHARMACY_ORDER_PAID',
        });

        // Push confirmation to user
        if (patient?.fcmToken) {
            await sendPushNotification(
                patient.fcmToken,
                'Payment Confirmed 🎉',
                `Your payment of LKR ${request.price} was received. The pharmacy will process your order shortly.`
            );
        }

        // SMS to user confirming payment
        if (patient?.phone) {
            await sendSMS(
                patient.phone,
                `Lakwedha Pharmacy 💊\nPayment Confirmed!\nAmount: LKR ${request.price}\nYour order is being processed. Thank you!`
            );
        }
    } catch (notifyErr) {
        console.error('[PharmacyRequest] Pay notification error:', notifyErr.message);
    }

    res.json({ success: true, data: request, message: 'Payment confirmed. Pharmacy will process your order.' });
});

// ── Pharmacy: Update order status (processing / completed) ───────────────────
exports.updateRequestStatus = asyncHandler(async (req, res) => {
    const pharmacyId = req.user?.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['processing', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'status must be "processing" or "completed".' });
    }

    const request = await PharmacyRequest.findOne({ _id: id, pharmacyId });
    if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
    }

    const allowed = { processing: ['paid'], completed: ['processing'] };
    if (!allowed[status].includes(request.status)) {
        return res.status(400).json({ success: false, message: `Cannot move from ${request.status} to ${status}.` });
    }

    request.status = status;
    await request.save();

    res.json({ success: true, data: request, message: `Order marked as ${status}.` });
});

// ── Patient: Cancel a pending request ────────────────────────────────────────
exports.cancelRequest = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const { id }  = req.params;

    const request = await PharmacyRequest.findOne({ _id: id, userId });
    if (!request) {
        return res.status(404).json({ success: false, message: 'Request not found.' });
    }
    if (request.status !== 'pending') {
        return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled.' });
    }

    request.status = 'cancelled';
    await request.save();

    res.json({ success: true, data: request, message: 'Request cancelled.' });
});

// ── Admin: Get all requests (with filters) ───────────────────────────────────
exports.getAllRequests = asyncHandler(async (req, res) => {
    const { status, pharmacyId, province } = req.query;
    const filter = {};
    if (status)     filter.status     = status;
    if (pharmacyId) filter.pharmacyId = pharmacyId;
    if (province)   filter['location.province'] = { $regex: new RegExp(`^${province}$`, 'i') };

    const requests = await PharmacyRequest.find(filter)
        .sort({ createdAt: -1 })
        .lean();

    // Enrich pharmacy info
    const pharmacyIds = [...new Set(requests.map((r) => r.pharmacyId.toString()))];
    const pharmacies  = await Pharmacy.find({ _id: { $in: pharmacyIds } })
        .select('pharmacyName address city district province')
        .lean();
    const pharmacyMap = {};
    pharmacies.forEach((p) => { pharmacyMap[p._id.toString()] = p; });

    const enriched = requests.map((r) => ({
        ...r,
        pharmacy: pharmacyMap[r.pharmacyId.toString()] || null,
    }));

    res.json({ success: true, data: enriched, message: 'All requests fetched.' });
});
