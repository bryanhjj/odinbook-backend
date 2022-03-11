var mongoose = require('mongoose');
import { format } from 'date-fns';

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    comment_content: {type: String, required: true},
    comment_timestamp: {type: Date, required: true},
    comment_author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    related_post: {type: Schema.Types.ObjectId, ref: 'Post', required: true},
    comment_likes: [{type: Schema.Types.ObjectId, ref: 'User', required: true}],
});

// Virtual for the post's URL
CommentSchema.virtual('url').get(function() {
    return '/post/comment/' + this._id;
});

// Virtual for a more tidy timestamp format
CommentSchema.virtual('timestamp').get(function() {
    return format(new Date(this.comment_timestamp), "dd-MM-yyyy ' @ ' HH:mm");
});

//Export model
module.exports = mongoose.model('Comment', CommentSchema);