import Comment from "../models/comment.model.js";
import Post from "../models/post.model.js";
import { createNotification } from "../repositories/notification.repository.js";
import { getIO } from "../sockets/index.js";
import { getUser } from "../sockets/users.js";

class CommentService {

    async createComment(data) {
        const comment = await Comment.create(data);
        
        await comment.populate("user", "username profilePic");

        const post = await Post.findById(data.post);
        const io = getIO();

        io.emit("newComment", comment);

        await createNotification({
            sender: data.user,
            receiver: post.user,
            type: "comment",
            post: post._id,
            message: data.text
        });

        const socketId = getUser(post.user.toString());
        if (socketId) {
            io.to(socketId).emit("notification", {
                type: "comment",
                post,
                comment,
                message: data.text,
                sender: await User.findById(data.user).select("username profilePic")
            });
        }

        return comment;
    }

    async getCommentsByPost(postId) {
        return await Comment.find({ post: postId }).populate("user", "username profilePic");
    }

    async deleteComment(commentId, userId) {
        const comment = await Comment.findById(commentId);

        if (!comment) throw new Error("Not found");
        if (comment.user.toString() !== userId.toString()) {
            throw new Error("Unauthorized");
        }

        await comment.deleteOne();

        const io = getIO();
        io.emit("commentDeleted", commentId);

        return true;
    }

    async editComment(commentId, userId, text) {
        const comment = await Comment.findById(commentId);

        if (!comment) throw new Error("Not found");
        if (comment.user.toString() !== userId.toString()) {
            throw new Error("Unauthorized");
        }

        comment.text = text;
        await comment.save();
        await comment.populate("user", "username profilePic");

        const io = getIO();
        io.emit("commentUpdated", comment);

        return comment;
    }

    async replyToComment(commentId, replyData) {
        const comment = await Comment.findById(commentId);

        if (!comment) throw new Error("Comment not found");

        comment.replies.push(replyData);
        await comment.save();
        await comment.populate("user", "username profilePic");

        const io = getIO();
        io.emit("replyAdded", comment);

        const socketId = getUser(comment.user.toString());

        await createNotification({
            sender: replyData.user,
            receiver: comment.user,
            type: "reply",
            post: comment.post
        });

        if (socketId) {
            io.to(socketId).emit("notification", {
                type: "reply",
                comment
            });
        }

        return comment;
    }

    async editReply(commentId, replyId, userId, text) {
        const comment = await Comment.findById(commentId);

        if (!comment) throw new Error("Comment not found");

        const reply = comment.replies.id(replyId);

        if (!reply) throw new Error("Reply not found");
        if (reply.user.toString() !== userId.toString()) {
            throw new Error("Unauthorized");
        }

        reply.text = text;
        await comment.save();
        await comment.populate("user", "username profilePic");

        getIO().emit("replyUpdated", comment);

        return comment;
    }

    async deleteReply(commentId, replyId, userId) {
        const comment = await Comment.findById(commentId);

        if (!comment) throw new Error("Comment not found");

        const reply = comment.replies.id(replyId);

        if (!reply) throw new Error("Reply not found");
        if (reply.user.toString() !== userId.toString()) {
            throw new Error("Unauthorized");
        }

        reply.deleteOne();
        await comment.save();
        await comment.populate("user", "username profilePic");

        getIO().emit("replyDeleted", { commentId, replyId });

        return comment;
    }

    async likeComment(commentId, userId) {
        const comment = await Comment.findById(commentId);

        if (!comment) throw new Error("Comment not found");

        const liked = comment.likes.includes(userId);

        if (liked) {
            comment.likes.pull(userId);
            comment.likeCount--;
        } else {
            comment.likes.push(userId);
            comment.likeCount++;

            if (comment.user.toString() !== userId.toString()) {
                const socketId = getUser(comment.user.toString());

                await createNotification({
                    sender: userId,
                    receiver: comment.user,
                    type: "like_comment",
                    post: comment.post
                });

                if (socketId) {
                    getIO().to(socketId).emit("notification", {
                        type: "like_comment",
                        comment
                    });
                }
            }
        }

        await comment.save();
        await comment.populate("user", "username profilePic");
        getIO().emit("commentLiked", comment);

        return comment;
    }

    async likeReply(commentId, replyId, userId) {
        const comment = await Comment.findById(commentId);

        if (!comment) throw new Error("Comment not found");

        const reply = comment.replies.id(replyId);

        if (!reply) throw new Error("Reply not found");

        const liked = reply.likes.includes(userId);

        if (liked) {
            reply.likes.pull(userId);
            reply.likeCount--;
        } else {
            reply.likes.push(userId);
            reply.likeCount++;

            if (reply.user.toString() !== userId.toString()) {
                const socketId = getUser(reply.user.toString());

                await createNotification({
                    sender: userId,
                    receiver: reply.user,
                    type: "like_reply",
                    post: comment.post
                });

                if (socketId) {
                    getIO().to(socketId).emit("notification", {
                        type: "like_reply",
                        comment,
                        replyId
                    });
                }
            }
        }

        await comment.save();
        await comment.populate("user", "username profilePic");
        getIO().emit("replyLiked", comment);

        return comment;
    }
}

export default new CommentService();