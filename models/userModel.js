const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
        minlength: [8, 'Password Must Be At Least 8 Characters Long'],
        match: [/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/, 'Password must contains at least 1 uppercase letter, 1 lowercase letter, 1 number, and 8 characters long']
    },
    verified: Boolean,

    role: {
        type: Number,
        default: 0
    },


    // confirmPassword: {
    //     type: String,
    //     required: [true, 'Password must match'],
    //     minlength: [8, 'Password Must Be At Least 8 Characters Long']
    // }
}, { timestamps: true });

// encrypting password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    this.password = await bcrypt.hashSync(this.password, 10)
})

// verify password
userSchema.methods.comparePassword = async function (verifyingPassword) {
    return await bcrypt.compareSync(verifyingPassword, this.password);
}

const User = mongoose.model('Users', userSchema);
module.exports = User;