const express = require('express');
const router = express.Router();
const {CreateUser, LoginUser} = require('../controllers/usersController')

// router.get('/', (req,res)=>{res.send("test")})
router.post('/register', CreateUser);
router.post('/login', LoginUser);


module.exports = router