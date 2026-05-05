import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './backend/models/auth.model.js';

dotenv.config({ path: './backend/.env' });

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}, 'username email');
        console.log("Total users found:", users.length);
        console.log(users);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
