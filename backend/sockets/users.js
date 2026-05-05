const users = new Map();

export const addUser = (userId, socketId) => {
    users.set(userId, socketId);
};

export const getUser = (userId) => {
    return users.get(userId);
};

export const removeUser = (socketId) => {
    for (let [userId, sId] of users.entries()) {
        if (sId === socketId) {
            users.delete(userId);
            break;
        }
    }
};