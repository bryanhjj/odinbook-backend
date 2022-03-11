const Post = require('../models/post');
const Comment = require('../models/comment');
const { body,validationResult } = require("express-validator");
var async = require('async');


// (POST) Create a new comment
exports.comment_create = [
    // Validate user input
    body('comment_content', 'You can\'t send an empty comment!').trim().isLength({ min: 1 }),

    // Proceed with the req after data has been validated
    async (req, res, next) => {
        // Extract errors, if any
        const errors = validationResult(req);
        // Create a new Post object with the validated data
        var newComment = new ({
            comment_content: req.body.comment_content,
            comment_timestamp: new Date(),
            comment_author: req.payload.id,
            related_post: req.params.postId,
            comment_likes: [],
        });
        if (!errors.isEmpty()) {
            // There are errors
            return res.status(500).json({error: errors});
        } else {
            await newComment.save(function(err){
                if (err) {
                    return res.status(500).json({error: err});
                } else {
                    const relatedPost = Post.findById(req.params.postId);
                    relatedPost.post_comments.push(newComment);
                    await relatedPost.save();
                    return res.status(201).json({message: 'Successfully commented', comment: newComment});
                }
            });
        }
    }
];

// (POST) Edit a comment
exports.comment_edit = [
    // Validate user input.
    body('comment_content', 'You can\'t send an empty comment!').trim().isLength({ min: 1 }),

    // Proceed with the edit request.
    (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a new Post object to replace the old one.
        var newComment = new ({
            comment_content: req.body.comment_content,
            comment_timestamp: new Date(),
            comment_author: req.payload.id,
            related_post: req.body.related_post,
            comment_likes: req.body.comment_likes,
            _id: req.params.id, // required if we're updating via POST method
        });
        if (!errors.isEmpty()) {
            // There are errros
            return res.status(500).json({error: errors});
        } 
        if (newComment.comment_author != req.payload.id) {
            // When a user tries to edit someone else's comment
            return res.status(401).json({message: 'You are not authorized to edit this comment.'});
        }
        else {
            // No problems, finalizing the edit/update
            Comment.findByIdAndUpdate(req.params.commentId, newComment, {}, function(err, updatedComment){
                if (err) {
                    return res.status(500).json({error: err});
                } else {
                    // Edit/update success
                    res.status(201).json({message: 'Comment successfully updated.', comment: updatedComment});
                }
            });
        }
    }
];

// (DELETE) Delete a comment
exports.comment_delete = async function (req, res, next) {
    const targetComment = await Comment.findById(req.params.commentId);
    if (!targetComment) {
        return res.status(404).json({message: 'Comment not found.'});
    }
    if (targetComment.comment_author != req.payload.id) {
        return res.status(401).json({message: 'You are not authorized to delete this comment.'})
    }
    const deletedComment = await Comment.findByIdAndDelete(req.params.commentId);
    if (deletedComment) {
        return res.status(200).json({message: 'Message deleted successfully.', comment: deletedComment});
    } else {
        return res.status(500).json({message: 'An error has occurred.'});
    }
};

// (PUT) Toggle like/dislike for a comment
exports.comment_like = async function(req, res, next) {
    const targetComment = await Comment.findById(req.params.commentId);
    if (!targetComment) {
        return res.status(404).json({message: 'Comment not found.'});
    }
    if (targetComment.comment_likes.includes(req.payload.id)) {
        let oldLikes = [...targetComment.comment_like];
        let updatedLikes = oldLikes.filter((userId) => {
            userId != req.payload.id;
        });
        targetComment.comment_likes = updatedLikes;
        const updatedComment = await targetComment.save();
        return res.status(201).json({message: 'Comment unliked.', comment: updatedComment});
    }
    targetComment.comment_like.push(req.payload.id);
    const updatedComment = await targetComment.save();
    return res.status(201).json({message: 'Comment liked.', comment: updatedComment});
};