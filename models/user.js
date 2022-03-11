var mongoose = require('mongoose');
var findOrCreate = require("mongoose-findorcreate");

var Schema = mongoose.Schema;

// Schema for our User model
var UserSchema = new Schema({
    first_name: {type: String, required: true},
    last_name: {type: String, required: true},
    username: {type: String, required: true},
    password: {type: String, required: true},
    email: {type: String, required: true},
    phone_number: {type: Number, required: false},
    profile_pic: {type: String, required: false}, // Optional, to throw in a default picture when none is provided
    friend_list: [{type: Schema.Types.ObjectId, ref: 'User'}],
    friend_req_sent: [{type: Schema.Types.ObjectId, ref: 'User'}],
    friend_req_rec: [{type: Schema.Types.ObjectId, ref: 'User'}],
    // for facebook integration
    facebookId: { type: String, required: false }
});

// Virtual for getting our user's full name
UserSchema.virtual('name').get(function() {
    return this.first_name + ' ' + this.last_name;
});

// Virtual for url for the user's profile page
UserSchema.virtual('url').get(function() {
    return '/user/' + this._id;
});

// Apply findOrCreate plugin to UserSchema.
UserSchema.plugin(findOrCreate);

// Export model
module.exports = mongoose.model('User', UserSchema);