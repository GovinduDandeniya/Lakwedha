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
    smsStatus = null
) => {
    try {
        //  Persist in-app notification
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            referenceId,
            referenceModel,
            smsStatus: 'skipped',
        });
