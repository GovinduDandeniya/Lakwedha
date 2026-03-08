const notificationService = require('./notificationService');
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
