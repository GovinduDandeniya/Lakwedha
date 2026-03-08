const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('./notificationController');

router.use(auth);

router.get('/', ctrl.getNotifications);//paginated list
router.get('/over-count', ctrl.getUnreadCount);//badge count
router.get('/history', ctrl.getHistory);//full history