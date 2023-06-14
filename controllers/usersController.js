const User = require('../models/userModel');


const CreateUser = async (req, res, next) => {
    try {
        const {userName, firstName, lastName, email, password, role} = req.body;
        const emailExist = await User.findOne({email});
        const usernameExist = await User.findOne({userName});
        if (emailExist){
            return res.status(400).json({
                success: false,
                msg: "Email already exists"
            })
        }
        if (usernameExist){
            return res.status(400).json({
                success: false,
                msg: "Username already exists"
            })
        }
        const newUser = new User({
            userName, firstName, lastName, email, password, role
        });
        await newUser.save();
        res.status(201).json({
            success: true,
            msg: 'User Created',
            data: newUser});
        
    } catch (error) {
        console.log(error),
        
        res.status(400).json({
            success: false,
            msg:error.message})
    }
};

const LoginUser = async (req, res, next) => {
    try {
        // name of the email and password destructed from the req.body have to matched the fields of users document
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                success: false,
                msg: "Email and password are required"
            })
        }

        // verify user email
        const user = await User.findOne({email});
        
        if(!user){
            return res.status(400).json({
                success: false,
                msg: "Invalid credentials"
            })
        }

        // verify user password
        const isMatched = await user.comparePassword(password)
        if(!isMatched){
            return res.status(400).json({
                success: false,
                msg: "Invalid credentials"
            })
        }

        res.status(200).json({
            success: true,
            user
        });
        
    } catch (error) {
        console.log(error);
        res.status(400).json({
            success: false,
            msg: "Cannot log in, check your credentials"})
    }
};

module.exports = {
    CreateUser, LoginUser
}