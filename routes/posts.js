var express = require('express');
var router = express.Router();
const postController = require('../controllers/postController');
const passport = require('passport');
const commentController = require('../controllers/commentController');
var getToken = require('../utils/getToken');

router.use(passport.authenticate(['jwt', 'facebook-token'], {session: false}));
router.use(getToken);

// Comments related stuff
// PUT toggle like/dislike
router.put('/:postId/comments/:commentId/like', commentController.comment_like);
// GET a specific comment
router.get('/:postId/comments/:commentId',commentController.comment_get);
// POST edit a comment
router.post('/:postId/comments/:commentId', commentController.comment_edit);
// DELETE a comment
router.delete('/:postId/comments/:commentId', commentController.comment_delete);
// POST new comment
router.post('/:postId/comments/', commentController.comment_create);

// Posts related stuff
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