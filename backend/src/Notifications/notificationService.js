const Notification = require('../models/Notification');
const User = require('../models/user');
const { sendSMS } = require('./smsGateway');
const templates = require('./smsTemplates');
/** 
 @param {string|ObjectId} userId
 @param {string} type                       //appointment,order,prescription,system
 @param {string} title                     // Short notification title
 @param {string} message                   //Full notification message
 @param {string|ObjectId} [referenceId]   //Related document ID
 @param {string} [referenceModel]         //Related model name
 @param {string} [smsMessage]             //Override SMS text (defaults to message)
 @returns {Promise<Notification>}
*/
const createNotification = async (
    userId,
    type,
    title,
    message,
    referenceId = null,
    referenceModel = null,
    smsMessage = null
) => {
    try {
        // 1. Persist in-app notification
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            referenceId,
            referenceModel,
            smsStatus: 'skipped',
        });
// 2. Attempt SMS 
        setImmediate(async () => {
            try {
                const user = await User.findById(userId).select('phone name');
                if (user && user.phone) {
                    const smsBody = smsMessage || message;
                    const result = await sendSMS(user.phone, smsBody);
                    const smsStatus = result.skipped ? 'skipped' : result.success ? 'sent' : 'failed';
                    await Notification.findByIdAndUpdate(notification._id, {
                        smsStatus,
                        smsSid: result.sid,
                    });
                }
            } catch (err) {
                console.error('[NotificationService] SMS dispatch error:', err.message);
            }
        });

        return notification;
    } catch (err) {
        // Never crash the calling controller over a notification error
        console.error('[NotificationService] createNotification error:', err.message);
        return null;
    }
};

const getUserNotifications = async (userId, page = 1, limit = 20) => {
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
        Notification.find({ userId })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Notification.countDocuments({ userId }),
    ]);
    return {
        notifications,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        },
    };
};

const getUnreadCount = async (userId) => {
    return Notification.countDocuments({ userId, isRead: false });
};

const markAsRead = async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: notificationId, userId },
        { isRead: true },
        { new: true }
    );
    if (!notification) {
        const err = new Error('Notification not found or access denied');
        err.statusCode = 404;
        throw err;
    }
    return notification;
    return result.modifiedCount;
};
const getNotificationHistory = async (userId, type = null) => {
    const filter = { userId };
    if (type) filter.type = type;
    return Notification.find(filter).sort({ createdAt: -1 }).lean();
};

const notifyAppointment = async (appointment, status, patientName, doctorName) => {
    const typeLabels = {
        confirmed: 'Appointment Confirmed',
        cancelled: 'Appointment Cancelled',
        rescheduled: 'Appointment Rescheduled',
        pending: 'Appointment Booked',
        completed: 'Appointment Completed',
        'no-show': 'Appointment Missed',
    };
    const title = typeLabels[status] || 'Appointment Update';
    const message = templates.appointmentStatusChange(patientName, status, appointment.slotTime);
     return createNotification(
        appointment.patientId,
        'appointment',
        title,
        message,
        appointment._id,
        'Appointment',
        message
    );
};
const notifyOrderStatus = async (order, status, userName) => {
    const statusLabels = {
        pending: 'Order Received',
        approved: 'Order Approved',
        processing: 'Order Processing',
        shipped: 'Order Shipped',
        completed: 'Order Delivered',
    };
    const title = statusLabels[status] || 'Order Update';
    const smsMsg = templates.orderStatusChange(userName, order._id, status);

       return createNotification(
        order.userId,
        'order',
        title,
        smsMsg,
        order._id,
        'Order',
        smsMsg
    );
};
