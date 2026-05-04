const express = require('express');
const router = express.Router();
const userController = require('../controllers/UserController');

router.get('/', userController.getUsers.bind(userController));
router.get('/:userId/schedule', userController.getUserSchedule.bind(userController));

module.exports = router;
