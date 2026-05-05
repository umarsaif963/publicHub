import User from '../models/auth.model.js';

export const findUserByEmail = async (email) => {
    return await User.findOne({ email });
};

export const createUser = async (userData) => {
    return await User.create(userData);
};