import Comment from "../models/comment.model.js";

export const createComment = (data) => Comment.create(data);

export const getCommentsByPost = (postId) =>
    Comment.find({ post: postId });

export const deleteComment = (id, userId) =>
    Comment.findOneAndDelete({ _id: id, user: userId });

export const updateComment = (id, userId, text) =>
    Comment.findOneAndUpdate(
        { _id: id, user: userId },
        { text },
        { new: true }
    );   