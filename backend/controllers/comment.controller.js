import commentService from "../services/comment.service.js";

export const createComment = async (req, res) => {
    try {
        const comment = await commentService.createComment({
            post: req.body.post,
            user: req.user,
            text: req.body.text
        });
        res.status(201).json(comment);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const getComments = async (req, res) => {
    try {
        const comments = await commentService.getCommentsByPost(req.params.postId);
        res.json(comments);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

export const deleteComment = async (req, res) => {
    try {
        await commentService.deleteComment(req.params.id, req.user);
        res.json({ message: "Deleted" });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

export const editComment = async (req, res) => {
    try {
        const updated = await commentService.editComment(
            req.params.id,
            req.user,
            req.body.text
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const replyToComment = async (req, res) => {
    try {
        const updated = await commentService.replyToComment(req.params.id, {
            user: req.user,
            text: req.body.text
        });
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const editReply = async (req, res) => {
    try {
        const updated = await commentService.editReply(
            req.params.commentId,
            req.params.replyId,
            req.user,
            req.body.text
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const deleteReply = async (req, res) => {
    try {
        const updated = await commentService.deleteReply(
            req.params.commentId,
            req.params.replyId,
            req.user
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const likeComment = async (req, res) => {
    try {
        const updated = await commentService.likeComment(
            req.params.id,
            req.user
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

export const likeReply = async (req, res) => {
    try {
        const updated = await commentService.likeReply(
            req.params.commentId,
            req.params.replyId,
            req.user
        );
        res.json(updated);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};