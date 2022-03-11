const User = require('../models/user');
const Post = require('../models/post');
const Comment = require('../models/comment');
const { check, body, validationResult } = require("express-validator");
const { issueJWT, validatePassword, generatePassword} = require('../utils/bcrypt');
var async = require("async");
const upload = require('../utils/multUpload');

// Get all users
exports.user_list = function (req, res, next) {
    User.find()
    .exec(function(err, user_list) {
        if (err) {
            return res.status(500).json({message: err});
        }
        return res.status(200).json({users: user_list});
    });
};

// POST search for a specific user (user search feature)
exports.user_search = [

    body('userQuery1').trim().escape(),
    body('userQuery2').trim().escape(),

    async (req, res, next) => {
        const searchResults = await User.findOne({
            $and: [
                {first_name: {$regex: new RegExp(req.body.userQuery1, "i")}},
                {last_name: {$regex: new RegExp(req.body.userQuery2, "i")}},
            ],
        });

        // found a match
        if (searchResults) {
            return res.status(201).json({message: 'User found.',user: searchResults});
        } else {
            return res.status(404).json({message: 'User not found.', error: 'User not found.'});
        };
    }
];

// POST request for creating a new user.
exports.user_create = [

    // Middleware for handling images
    upload.single('profile_pic'),

    // Validate user input when registering.
    body('first_name', 'First name required').trim().isLength({ min: 1 }).escape(),
    body('last_name', 'Last name required').trim().isLength({ min: 1 }).escape(),
    body('username', 'Username required').trim().isLength({ min: 1 }).escape(),
    body('password', 'Password required').trim().isLength({ min: 1 }).escape(),
    body('email', 'E-mail required').isEmail().normalizeEmail(),
    body('phone_number', 'Phone number required').trim().isLength({ min: 1 }).escape(),
    // Validate confirm_password field matches password before proceeding
    body('confirm_password').custom((value, {req}) => {
        if (value != req.body.password) {
            throw new Error ('Password confirmation does not match password');
        }
        return true;
    }),

    // Proceed with registering the user after validation.
    async (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        var newUser = new User ({
            first_name: req.body.first_name,
            last_name: req.body.last_name,
            username: req.body.username,
            password: req.body.password,
            email: req.body.email,
            phone_number: req.body.phone_number,
            profile_pic: '',
            friend_list: [],
            friend_req_sent: [],
            friend_req_rec: []
        });
        if (!errors.isEmpty()) {
            // There are errors.
            return res.status(400).json({error: errors.array()});
        } else {
            // User input is valid.
            // Check if username already exists.
            User.findOne({'username':req.body.username}).exec(function(err, foundDupeUser) {
                if(err) {
                    return next(err);
                }
                if(foundDupeUser) {
                    let dupeError = [
                        {
                            'location': 'body',
                            'msg': 'Username already taken.',
                            'param': 'username'
                        }
                    ];
                    return res.status(400).json({error: dupeError});
                } else {
                    // hashing user password for security.
                    var hash = generatePassword(newUser.password);
                    newUser.password = hash;
                    // if user have submitted a profil pic while signing up/registering
                    // to double check
                    if (req.hasOwnProperty('file')) {
                        newUser.profile_pic = `${process.env.BASE_URL}/public/images/` + req.file.filename;
                    }
                    newUser.save(function(err) {
                        if (err) {
                            return next(err);
                        }
                        // Success, redirect user to the home page.
                        const tokenObj = issueJWT(newUser);
                        return res.status(201).json({
                            message: 'Registration successful',
                            token: tokenObj,
                            user: {
                                first_name: newUser.first_name,
                                last_name: newUser.last_name,
                                username: newUser.username,
                                email: newUser.email,
                                id: newUser._id,
                                profile_pic: newUser.profile_pic ? newUser.profile_pic : "",
                            }
                        })
                    });
                }
            });
        }
    }
];

// Get specific user.
exports.user_detail = function(req, res, next) {
    // grab user details as well as posts sent by the user.
    async.parallel({
        user: function(callback) {
            User
            .findById(req.params.id)
            .populate('friend_list')
            .populate('friend_req_sent')
            .populate('friend_req_rec')
            .exec(callback);
        },
        posts: function(callback) {
            Post
            .find({'post_author': req.params.id})
            .populate('post_author')
            .exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return res.status(500).json({message: err});
        }
        // if user do not exist.
        if (results.user == null) {
            return res.status(404).json({message: 'User not found.', error: 'User not found.'});
        }
        res.status(200).json({user: results});
    });
};

// (PUT) Update user profile.
// initially a POST method, now separated into a PUT + POST(for updating profile picture) method
exports.user_update = [

    // Validate the users' input for updating their profile.
    check("password").exists(),
    check("confirmPassword", "Password and confirmed password must match")
      .exists()
      .custom((value, { req }) => value === req.body.password),
    body('first_name', 'First name required').trim().isLength({ min: 1 }).escape(),
    body('last_name', 'Last name required').trim().isLength({ min: 1 }).escape(),

    // Proceed with the update request.
    (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            // There are errors.
            return res.status(500).json({message: errors});
        } else {
            async.parallel({
                user: function(callback) {
                    User.findById(req.payload.id).exec(callback);
                },
            }, function(err, results) {
                if (err) {
                    return res.status(500).json({message: err});
                }
                if (results.user == null) {
                    return res.status(404).json({message: 'User not found'});
                }
                results.user.first_name = req.body.first_name;
                results.user.last_name = req.body.last_name;
                results.user.phone_number = req.body.phone_number;
                results.user.email = req.body.email;

                const updatedUser = results.user.save();
                const tokenObj = issueJWT(updatedUser)
                return res.status(201).json({
                    message: 'Update successful',
                    token: tokenObj,
                    user: updatedUser
                });
            });
        }
    }
];

// (POST) for updating a user profile picture
exports.profile_pic_update = [
    body("imageFile")
    .custom((value, { req }) => {
        if (!req.file) {
            return "No image was uploaded";
        } else if (
            req.file.mimetype === "image/bmp" ||
            req.file.mimetype === "image/gif" ||
            req.file.mimetype === "image/jpeg" ||
            req.file.mimetype === "image/png" ||
            req.file.mimetype === "image/tiff" ||
            req.file.mimetype === "image/webp"
        ) {
            return "image"; // return "non-falsy" value to indicate valid data"
        } else {
            return false;
        }
    }).withMessage("Only image files are accepted."),

    upload.single("new_profile_pic"),

    // proceed with the update request after the user has uploaded an appropriate image file
    async (req, res, next) => {

        // Extract the validation errors from a request.
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(500).json({message: errors});
        } else {
            async.parallel({
                user: function(callback) {
                    User.findById(req.payload.id);
                },
            }, function(err, results) {
                if (err) {
                    return res.status(500).json({message: err});
                }
                if (results.user == null) {
                    return res.status(404).json({message: 'User not found.'});
                }
                results.user.profile_pic = req.file ? 
                    `${process.env.BASE_URL}/public/images/` + req.file.filename : null;
                const updatedUser = results.user.save();
                return res.status(201).json({
                    message: "Profile picture successfully updated",
                    user: updatedUser,
                });
            });
        };
    }
];

// Delete a user profile
// how will we deal with the friend related things when a user deletes his/her profile?
exports.user_delete = function (req, res, next) {
    // console.log(req.params.userId, req.payload.id); // for troubleshooting
    if (req.params.userId !== req.payload.id) {
        return res.status(401).json({message: 'You can only delete your own account!'});
    }
    async.parallel({
        user: function(callback) {
            User.findById(req.body.userid).exec(callback);
        },
        posts: function(callback) {
            Post.find({'post_author': req.body.userid}).exec(callback);
        },
        comments: function(callback) {
            Comment.find({'comment_author': req.body.userid}).exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return res.status(500).json({message: err});
        }
        if (results.posts.length > 0) {
            for (let p of results.posts) {
                Post.findByIdAndRemove(p._id, function deletePost(err){
                    if (err) {
                        return res.status(500).json({message: err});
                    }
                });
            }
        }
        if (results.comments.length > 0) {
            for (let c of results.comments) {
                Comment.findByIdAndRemove(c._id, function deleteComment(err){
                    if (err) {
                        return res.status(500).json({message: err});
                    }
                });
            }
        }
        User.findByIdAndRemove(req.body.userid, function deleteUser(err){
            if (err) {
                return res.status(500).json({message: err});
            }
        });
        const otherUsers = await User.find({ _id: {$ne: req.params.userId}});
        // for updating other user's friend list if it includes the deleted user (to test extensively)
        for (u of otherUsers) {
            const updatedFriends = u.friend_list.filter((id) => id !== req.params.userId);
            const updatedFriendReq = u.friend_req_rec.filter((id) => id !== req.params.userId);
            const updatedFriendSent = u.friend_req_sent.filter((id) => id !== req.params.userId);
            u.friend_list = updatedFriends;
            u.friend_req_rec = updatedFriendReq;
            u.friend_req_sent = updatedFriendSent;
            await u.save;
        }
        return res.status(200).json({message: 'User deleted'});
    });
};

// (POST) send a friend request to a user
exports.user_FLreq = function(req, res, next){
    const {target_userId} = req.body;
    async.parallel({
        user: function(callback) {
            User.findById(target_userId).exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return res.status(500).json({message: err});
        }
        if (results.user == null) {
            var err = new Error('User not found');
            err.status = 404;
            return res.status(500).json({message: err});
        }
        if (results.user._id == req.payload.id) {
            return res.status(400).json({ message: 'You cannot befriend yourself! You pepega.' });
        }
        if (results.user.friend_list.includes(req.payload.id)) {
            return res.status(400).json({ message: 'You are already friends with this user!' });
        }
        if (results.user.friend_req_rec.includes(req.payload.id)) {
            return res.status(400).json({ message: 'You have already sent a friend request to this user!' });
        }
        // If everything goes well
        // pushes the currently logged user's id into the target user's friend_req_rec
        const updatedFriendReq = [...results.user.friend_req_rec, req.payload.id];
        results.user.friend_req_rec = updatedFriendReq;
        const updatedTargetUser = await results.user.save();
        return res.status(200).json({ message: 'Friend request sent.', user: updatedTargetUser });
    });
};

// (PUT) accepting a friend request
exports.user_accept = function (req, res, next) {
    const {target_userId} = req.body;

    const targetUser = await User.findById(target_userId);
    const acceptingUser = await User.findById(req.payload.id); // the currently logged user, i.e.: you

    // checks if you've actually received a friend request from the target user
    if (!acceptingUser.friend_req_rec.includes(target_userId)) {
        return res.status(404).json({ message: 'Friend request not found.'});
    }

    // process for accepting a friend req on the currently logged user's (i.e.: you) end
    const updatedFriendReq = acceptingUser.friend_req_rec.filter((req) => {
        req != target_userId;
    });
    acceptingUser.friend_req_rec = updatedFriendReq;
    const updatedFriendList = [...acceptingUser.friend_list, target_userId];
    acceptingUser.friend_list = updatedFriendList;
    const updatedAcceptingUser = await acceptingUser.save();

    // process for friend request accepted on the target user's end (i.e.: the user who sent the req)
    const updatedTargetFriendSent = targetUser.friend_req_sent.filter((req) => {
        req != req.payload.id;
    });
    targetUser.friend_req_sent = updatedTargetFriendSent;
    const updatedTargetFriendList = [...targetUser.friend_list, req.payload.id];
    targetUser.friend_list = updatedTargetFriendList;
    await targetUser.save();

    const populate = await User.findById(updatedAcceptingUser._id).populate('friend_list');
    return res.status(201).json({ message: 'Friend request accepted.', user: populate});
};

// (DELETE) denying a friend request
exports.user_deny = function (req, res, next) {
    const {target_userId} = req.body;

    async.parallel({
        user: function(callback) {
            User.findById(target_userId).exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        // if the target user did not sent a friend request
        if (!results.user.friend_req_sent.includes(req.payload.id)) {
            return res.status(404).json({ message: 'Friend request not found.'});
        }
        const updatedFriendReq = results.user.friend_req_sent.filter((user) => {
            user != req.payload.id;
        });
        results.user.friend_req_sent = updatedFriendReq;
        await results.user.save();
    });

    async.parallel({
        user: function(callback) {
            User.findById(req.payload.id).exec(callback);
        },
    }, function(err, results) {
        if (err) {
            return next(err);
        }
        // to check if you've actually received a friend request from the target user
        if (!results.user.friend_req_rec.includes(target_userId)) {
            return res.status(404).json({ message: 'Friend request not found.'});
        }
        const updatedFriendReqRec = results.user.friend_req_rec.filter((user) => {
            user != target_userId;
        });
        results.user.friend_req_rec = updatedFriendReqRec;
        const updatedUser = await results.user.save();
        return res.status(200).json({ message: 'Friend request successfully deleted.', user: updatedUser});
    });
};