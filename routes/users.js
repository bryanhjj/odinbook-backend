var express = require('express');
var router = express.Router();
const user_controller = require('../controllers/userController');

// GET all users
router.get('/', user_controller.user_list);
// POST send a friend request
router.post('/req', user_controller.user_FLreq);
// PUT accept a friend request
router.put('/accept', user_controller.user_accept);
// DELETE reject a friend request
router.delete('/deny', user_controller.user_deny);
// POST user search feature
router.post('/search', user_controller.user_search);
// GET specific user
router.get('/:userId', user_controller.user_detail);
// PUT update user details
router.put('/:userId', user_controller.user_update);
// POST update user profile picture
router.post('/:userId', user_controller.profile_pic_update);
// DELETE a user
router.delete('/:userId', user_controller.user_delete);

module.exports = router;