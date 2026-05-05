import mongoose from "mongoose";

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        image:{
            type: String,
            default: null
        },
         description: {
            type: String
        },
        hashtag: {
            type: String
        },
        likes: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        likeCount: {
            type: Number,
            default: 0
        },
    },
    { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);

export default Post;