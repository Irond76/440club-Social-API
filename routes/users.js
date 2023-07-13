const express = require('express');
const router = express.Router();
const { CreateUser, VerifyEmail, VerifiedEmail, LoginUser, ForgotPassword, ResetPassword, HandleResetPassword } = require('../controllers/usersController')

// router.get('/', (req,res)=>{res.send("test")})
router.get('/verify/:userId/:uniqueString', VerifyEmail);
router.get('/verified', VerifiedEmail);
router.post('/register', CreateUser);
router.post('/login', LoginUser);
router.post('/forgot-password', ForgotPassword);
router.get('/reset-password/:id/:token', ResetPassword);
router.post('/reset-password/:id/:token', HandleResetPassword);

module.exports = router