const Users = require('../models/userModel');


const CreateUser = async (req, res) => {
    const {userName, firstName, lastName, email, password} = req.body;
    const newUser = new Users({
        userName, firstName, lastName, email, password
    });
    await newUser.save();
    res.status(201).json({msg: 'User Created', data: newUser});
};

module.exports = {
    CreateUser,
}