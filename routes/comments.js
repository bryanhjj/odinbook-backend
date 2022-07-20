// THIS WHOLE FILE IS NOW REDUNDANT, REPLACED BY POST ROUTER IN /routes/posts.js
/*
var express = require('express');
var router = express.Router();
const commentController = require('../controllers/commentController');
const passport = require('passport');
var getToken = require('../utils/getToken');

router.use(passport.authenticate(['jwt', 'facebook-token'], {session: false}));
router.use(getToken);

// PUT toggle like/dislike
router.put('/:commentId/like', commentController.comment_like);
// POST edit a comment
router.post('/:commentId', commentController.comment_edit);
// DELETE a comment
router.delete('/:commentId', commentController.comment_delete);
// POST new comment
router.post('/', commentController.comment_create);

module.exports = router;
*/