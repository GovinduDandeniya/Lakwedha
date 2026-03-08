const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ctrl = require('./notificationController');

router.use(auth);

router.get('/', ctrl.getNotifications);//paginated list
router.get('/unread-count', ctrl.getUnreadCount);//badge count
router.get('/history', ctrl.getHistory);//full history
router.put('/read-all', ctrl.markAllAsRead);//mark all as read
router.put('/:id/read', ctrl.markAsRead);//mark single as read

module.exports = router;