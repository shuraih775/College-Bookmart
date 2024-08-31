const User = require('../models/users');
const bcrypt = require('bcrypt');
class auth {

    async checkUserExists(email, username) {
        const existingUserByEmail = await User.findOne({ email });
        if (existingUserByEmail) {
            throw new Error('User already exists');
        }

        const existingUserByUsername = await User.findOne({ username });
        if (existingUserByUsername) {
            throw new Error('Username already exists');
        }
    }

    async verifyUser(email, password) {
        // Fetch the user from the database
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error('User does not exist');
        }
    
        // Compare the hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error('Wrong Password');
        }
    
        // If needed, return the user or a token instead of just true
        return { 
            id: user._id,
            email: user.email,
            username: user.username
        };
    }
    
}