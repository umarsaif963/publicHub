import mongoose from "mongoose";

const storySchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        media: {
            type: String,
            required: true
        },
        mediaType: {
            type: String,
            enum: ['image', 'video'],
            default: 'image'
        },
        viewers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        expiresAt: {
            type: Date,
            required: true,
            index: { expireAfterSeconds: 0 }
        }
    },
    { timestamps: true }
);

const Story = mongoose.model('Story', storySchema);

export default Story;