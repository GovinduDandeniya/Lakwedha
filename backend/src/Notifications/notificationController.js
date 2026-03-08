const notificationService = require('./notificationService');
/**
 * GET /api/notifications
 * Query: ?page=1&limit=20
 */
exports.getNotifications = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        const result = await notificationService.getUserNotifications(userId, page, limit);
        res.json(result);
    } catch (err) {
        next(err);
    }

};
/**
 * GET /api/notifications/unread-count
 */
exports.getUnreadCount = async (req, res, next) => {
    try {
        const count = await notificationService.getUnreadCount(req.user.id);
        res.json({ count });
    } catch (err) {
        next(err);
    }
};
/**
 * PUT /api/notifications/:id/read
 */
exports.markAsRead = async (req, res, next) => {
    try {
        const notification = await notificationService.markAsRead(req.params.id, req.user.id);
        res.json({ message: 'Notification marked as read', notification });
    } catch (err) {
        if (err.statusCode === 404) return res.status(404).json({ message: err.message });
        next(err);
    }
};
/**
 * PUT /api/notifications/read-all
 */
exports.markAllAsRead = async (req, res, next) => {
    try {
        const modifiedCount = await notificationService.markAllAsRead(req.user.id);
        res.json({ message: `${modifiedCount} notification(s) marked as read`, modifiedCount });
    } catch (err) {
        next(err);
    }
};
/**
 * GET /api/notifications/history
 * Query: ?type=appointment|order|prescription|system
 */
exports.getHistory = async (req, res, next) => {
    try {
        const { type } = req.query;
        const history = await notificationService.getNotificationHistory(req.user.id, type);
        res.json({ notifications: history, total: history.length });
    } catch (err) {
        next(err);
    }
};