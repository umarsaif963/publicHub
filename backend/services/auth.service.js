import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../repositories/auth.repository.js';

export const signupService = async ({ username, email, password, confirmPassword }) => {

    const existingUser = await findUserByEmail(email);

    if (existingUser) {
        throw new Error('EMAIL_EXISTS');
    }

    if (password !== confirmPassword) {
        throw new Error('PASSWORD_NOT_MATCH');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
        username,
        email,
        password: hashedPassword
    });

    return user;
};

export const loginService = async ({ email, password }) => {

    const user = await findUserByEmail(email);

    if (!user) {
        throw new Error('USER_NOT_FOUND');
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
        throw new Error('INVALID_PASSWORD');
    }

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
    );

    return {
        token,
        userId: user._id.toString(),
        user: {
            id: user._id.toString(),
            username: user.username,
            profilePic: user.profilePic || null,
            following: user.following || []
        }
    };
};

export const logoutService = async () => {
    return { message: "Logout successful" };
};