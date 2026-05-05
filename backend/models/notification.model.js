import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },
        type: {
            type: String,
            enum: ["like", "comment", "post", "follow", "reply", "like_comment", "like_reply"]
        },
        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        },
        message: {
            type: String,
            default: ""
        },
        isRead: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

const Notification = mongoose.model("Notification", notificationSchema);

export default Notification;