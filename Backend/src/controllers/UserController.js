const userService = require('../services/UserService');

class UserController {
    async getUsers(req, res) {
        try {
            const users = await userService.getUsers();
            res.json(users);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }

    async getUserSchedule(req, res) {
        try {
            const { userId } = req.params;
            const schedule = await userService.getUserSchedule(userId);
            res.json(schedule);
        } catch (e) {
            res.status(500).json({ error: e.message });
        }
    }
}
module.exports = new UserController();
