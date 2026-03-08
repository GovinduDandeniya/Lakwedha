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
                     Notification.findByIdAndUpdate(notification._id, {
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