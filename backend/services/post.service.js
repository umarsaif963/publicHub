import Post from "../models/post.model.js";
import { createNotification } from "../repositories/notification.repository.js";
import { getIO } from "../sockets/index.js";
import { getUser } from "../sockets/users.js";

export const createPostService = async (userId, data, followers) => {
    const post = await Post.create({
        ...data,
        user: userId
    });
    console.log("Saved Post:", post);

    const io = getIO();

    for (let follower of followers) {
        const socketId = getUser(follower.toString());

        if (socketId) {
            io.to(socketId).emit("newPost", post);
        }

        await createNotification({
            sender: userId,
            receiver: follower,
            type: "post",
            post: post._id
        });

        if (socketId) {
            io.to(socketId).emit("notification", {
                type: "post",
                post
            });
        }
    }

    return post;
};

export const getPostsService = async () => {
    return await Post.find()
        .populate("user", "username profilePic")
        .sort({ createdAt: -1 });
};

export const editPostService = async (postId, userId, data) => {
    const post = await Post.findById(postId);

    if (!post) throw new Error("Post not found");
    if (post.user.toString() !== userId) {
        throw new Error("Unauthorized");
    }

    post.description = data.description || post.description;
    post.image = data.image || post.image;

    await post.save();

    const io = getIO();
    io.emit("postUpdated", post);

    return post;
};

export const deletePostService = async (postId, userId) => {
    const post = await Post.findById(postId);

    if (!post) throw new Error("Post not found");
    if (post.user.toString() !== userId) {
        throw new Error("Unauthorized");
    }

    await post.deleteOne();

    const io = getIO();
    io.emit("postDeleted", postId);

    return { message: "Post deleted" };
};

export const toggleLikePostService = async (postId, userId) => {
    const post = await Post.findById(postId);

    if (!post) throw new Error("Post not found");

    const io = getIO();

    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
        post.likes.pull(userId);
        post.likeCount -= 1;
    } else {
        post.likes.push(userId);
        post.likeCount += 1;

        await createNotification({
            sender: userId,
            receiver: post.user,
            type: "like",
            post: postId
        });

        const socketId = getUser(post.user.toString());

        if (socketId) {
            io.to(socketId).emit("notification", {
                type: "like",
                post,
                sender: await User.findById(userId).select("username profilePic")
            });
        }
    }

    await post.save();

    io.emit("postUpdated", post);

    return post;
};