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
        minlength: [8, 'Password Must Be At Least 8 Characters Long']
        // pattern: '/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/'
    },
    // confirmPassword: {
    //     type: String,
    //     required: [true, 'Password must match'],
    //     minlength: [8, 'Password Must Be At Least 8 Characters Long']
    // }
}, {timestamps: true});

// encrypting password before saving
// userSchema.pre('save', async function(next){
//     if(!this.isModified('passowrd')){
//         next();
//     }
//     this.password = await bcrypt.hash(this.password, 10)
// })

const User = mongoose.model('User', userSchema);
module.exports = User;