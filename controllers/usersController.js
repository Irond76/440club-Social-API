const Users = require('../models/userModel');


const CreateUser = async (req, res) => {
    try {
        const {userName, firstName, lastName, email, password, } = req.body;
        const newUser = new Users({
            userName, firstName, lastName, email, password, 
        });
        await newUser.save();
        res.status(201).json({msg: 'User Created', data: newUser});
        
    } catch (error) {
        res.status(200).json({msg:error})
    }
};

module.exports = {
    CreateUser,
}