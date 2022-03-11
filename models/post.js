var mongoose = require('mongoose');
import { format } from 'date-fns';

var Schema = mongoose.Schema;

var PostSchema = new Schema({
    post_title: {type: String, required: true},
    post_content: {type: Schema.Types.Mixed, required: true},
    post_timestamp: {type: Date, required: true},
    post_author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    post_likes: [{type: Schema.Types.ObjectId, ref: 'User'}],
    post_comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
    post_img: {type: String, required: false} // Option for users to upload an image in their posts.
});

// Virtual for the post's URL
PostSchema.virtual('url').get(function() {
  return '/post/' + this._id;
});

// Virtual for a tidier timstamp format
PostSchema.virtual('timestamp').get(function() {
  return format(new Date(this.post_timestamp), "dd-MM-yyyy ' @ ' HH:mm");
});

//Export model
module.exports = mongoose.model('Post', PostSchema);