const express = require('express');
const router = express.Router();
const {CreateUser,} = require('../controllers/usersController')



router.post('/', CreateUser);


module.exports = router