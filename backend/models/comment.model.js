import mongoose from "mongoose";

const replySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: {
            type: String,
            required: true
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        likeCount: {
            type: Number,
            default: 0
        }
    },
    { timestamps: true }
)

const commentSchema = new mongoose.Schema(
    {
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        text: {
            type: String,
            required: true
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        likeCount: {
            type: Number,
            default: 0
        },
        replies: [replySchema]

    },
    { timestamps: true }
);

commentSchema.index({ post: 1 })

const Comment = mongoose.model('Comment', commentSchema);

export default Comment;