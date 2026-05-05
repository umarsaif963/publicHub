import Post from "../models/post.model.js";

export const createPost = (data) => Post.create(data);

export const getPostById = (id) => Post.findById(id);

export const deletePost = (id, userId) =>
    Post.findOneAndDelete({ _id: id, user: userId });

export const updatePost = (id, userId, data) =>
    Post.findOneAndUpdate({ _id: id, user: userId }, data, { new: true });