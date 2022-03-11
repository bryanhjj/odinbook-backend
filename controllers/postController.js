const User = require('../models/user');
const Post = require('../models/post');
const { body,validationResult } = require("express-validator");
var async = require("async");
var upload = require('../utils/multUpload');

// (GET) Get all posts
exports.post_list = async function (req, res, next) {
    const skip = Number(req.query.skip);
    const curUser = await User.findById(req.payload.id);
    Post.find({post_author: [req.payload.id, ...curUser.friend_list]}, null, {skip, limit: 20})
    .sort({timestamp: -1})
    .populate('post_author')
    .populate({
        path: 'post_comments',
        model: 'Comment',
        populate: {
            path: 'comment_author',
            model: 'User',
        }
    })
    .exec(function(err, post_list) {
        if (err) {
            return res.status(500).json({message: err});
        }
        return res.status(200).json({posts: post_list});
    });
};

// (GET) Get specific post
exports.post_detail = function (req, res, next) {
    async.parallel({
        post: function(callback) {
            Post.findById(req.params.id)
            .populate('author')
            .populate({
                path: 'post_comments',
                model: 'Comment',
                populate: {
                    path: 'comment_author',
                    model: 'User',
                }
            })
            .exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return res.status(500).json({message: err});
        }
        if (results.post == null) {
            var err = new Error('Post not found');
            err.status = 404;
            return next(err);
        }
        res.status(200).json({post: results.post});
    });
};

// (POST) create new post
exports.post_create = [
    // Middleware for uploading image
    upload.single('post_img'),

    // Validate user input
    body('post_title', 'Title required').trim().isLength({ min: 1 }).escape(),
    body('post_content', 'You can\'t send an empty post!').trim().isLength({ min: 1 }).escape(),

    // Proceed with the req after data has been validated
    async (req, res, next) => {
        // Extract errors, if any
        const errors = validationResult(req);
        // Create a new Post object with the validated data
        var newPost = new ({
            post_title: req.body.message_title,
            post_content: req.body.message,
            post_timestamp: new Date(),
            post_author: req.payload.id,
            post_likes: [],
            post_comments: [],
            post_img: '' // Option for users to upload an image in their posts.
        });
        if (!errors.isEmpty()) {
            return next(errors);
        } else {
            // if no image was added when posting
            if (!req.hasOwnProperty('file')) {
                await newPost.save(function(err){
                    if (err) {
                        return res.status(500).json({message: err});
                    }
                    return res.status(201).json({message: 'Successfully posted.', post: newPost});
                })
            } else {
                // user attached an image when creating post
                // double check BASE_URI
                newPost.post_img = `${process.env.BASE_URL}/public/images/` + req.file.filename;
                await newPost.save(function(err){
                    if (err) {
                        return res.status(500).json({message: err});
                    }
                    return res.status(201).json({message: 'Successfully posted.', post: newPost});
                });
            }
        }
    }
];

// (POST) Edit a post
exports.post_edit = [
    // Middleware for img uploading.
    upload.single('post_img'),

    // Validate user input.
    body('post_title', 'Title required').trim().isLength({ min: 1 }).escape(),
    body('post_content', 'You can\'t send an empty post!').trim().isLength({ min: 1 }).escape(),

    // Proceed with the edit request.
    async (req, res, next) => {
        // Extract the validation errors from a request.
        const errors = validationResult(req);
        // Create a new Post object to replace the old one.
        var newPost = new ({
            post_title: req.body.message_title,
            post_content: req.body.message,
            post_timestamp: new Date(),
            post_author: req.user._id,
            post_likes: req.body.post_likes,
            post_comments: req.body.post_comments,
            post_img: req.body.post_img, // Option for users to upload an image in their posts.
            _id: req.params.id,
        });
        if (!errors.isEmpty()) {
            // There are errros.
            return res.status(500).json({errors: errors});
        } 
        if (newPost.post_author != req.payload.id) {
            // When a user tries to edit someone else's post
            return res.status(401).json({message: 'You are not authorized to edit this post.'});
        }
        else {
            // If a new img has been attached.
            if (req.hasOwnProperty('file')) {
                newPost.post_img = `${process.env.BASE_URL}/public/images/` + req.file.filename;
            }
            // No problems, finalizing the edit/update.
            Post.findByIdAndUpdate(req.params.id, newPost, {}, function(err, updatedPost){
                if (err) {
                    return next(err);
                }
                return res.status(200).json({message: 'Successfully updated.', post: updatedPost});
            });
        }
    }
];

// (DELETE) Delete a post
exports.post_delete = async function (req, res, next) {
    try {
        const targetPost = await Post.findById(req.params.postId);
        if (!targetPost) {
            return res.status(404).json({message: 'Post not found.'});
        }
        if (targetPost.post_author != req.payload.id) {
            return res.status(401).json({message: 'You are not authorized to delete this post.'});
        }
        // To add in funtion to delete comments attached to the post when comments functions are finalized.
        Post.findByIdAndRemove(req.params.postId, function deletePost(err) {
            if (err) {
                return res.status(500).json({message: err});
            }
            res.status(500).json({message: 'Post deleted successfully.', deletedPost: targetPost});
        });
    } catch(e) {
        return res.status(500).json({error: e.message});
    }
};

// (PUT) Like/Dislike feature for posts - toggle 
exports.post_like = function(req, res, next) {
    async.parallel({
        post: function(callback) {
            Post.findById(req.params.postId).exec(callback);
        }
    }, function(err, results) {
        if (err) {
            return res.status(500).json({error: err});
        }
        if (!results.post) {
            return res.status(404).json({error: 'Post not found.'});
        }
        // For when users have previously 'liked' the post and pressed the like button again (ie. un-like).
        if (results.post.post_likes.includes(req.payload.id)) {
            let oldLikes = [...results.post.post_likes];
            let newLikes = oldLikes.filter((userId) => {
                userId != req.payload.id;
            });
            results.post.post_likes = newLikes;
            const updated = results.post.save(); // might need to await for this to save.
            return res.status(201).json({message: 'Post unliked.', post: updated});
        }
        // For when users are pressing the like button for the first time (ie. liking the post).
        let oldLikes = [...results.post.post_likes];
        let newLikes = oldLikes.push(req.payload.id);
        results.post.post_likes = newLikes;
        const updated = results.post.save(); // might need to await for this to save.
        return res.status(201).json({message: 'Post liked.', post: updated});
    });
};