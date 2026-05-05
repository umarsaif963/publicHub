import mongoose from "mongoose";

const messageRequestSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        isAccepted: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

messageRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

const MessageRequest = mongoose.model('MessageRequest', messageRequestSchema);

export default MessageRequest;