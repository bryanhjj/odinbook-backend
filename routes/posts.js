var express = require('express');
var router = express.Router();
const postController = require('../controllers/postController');
const passport = require('passport');
var getToken = require('../utils/getToken');

router.use(passport.authenticate(['jwt', 'facebook-token'], {session: false}));
router.use(getToken);

// PUT toggle like/dislike
router.put('/:postId/like', postController.post_like);
// GET specific post
router.get('/:postId', postController.post_detail);
// POST update/edit a post (with option to change image)
router.post('/:postId', postController.post_edit);
// DELETE a post
router.delete('/:postId', postController.post_delete);
// GET all user + friends post
router.get('/', postController.post_list);
// POST a new post
router.post('/', postController.post_create);

module.exports = router;