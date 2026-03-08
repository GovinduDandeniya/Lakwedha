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
try {
        const count = await notificationService.getUnreadCount(req.user.id);
        res.json({ count });
    } catch (err) {
        
    } catch (error) {
        
    } (err) 
        next(err);
