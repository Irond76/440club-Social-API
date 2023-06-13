const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        unique: true,
        required: [true, 'Enter User Name']
    },
    firstName: {
        type: String,
        required: [true, 'Enter Your First Name']
    },
    lastName: {
        type: String,
        required: [true, 'Enter Your Last Name']
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Please Provide Email']
    },
    password: {
        type: String,
        required: [true, 'Enter Password'],
        minlength: [8, 'Password Must Be At Least 8 Characters Long']
    },
    // confirmPassword: {
    //     type: String,
    //     required: [true, 'Password must match'],
    //     minlength: [8, 'Password Must Be At Least 8 Characters Long']
    // }
});

const User = mongoose.model('User', userSchema);
module.exports = User;