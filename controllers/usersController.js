const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// path for static verified page template
const path = require('path');

// mongodb user model
const User = require('../models/userModel');

// mongodb user verification model
const UserVerification = require('../models/userVerification');

// email handler
const nodemailer = require('nodemailer');

// unique string
const { v4: uuidv4 } = require('uuid');
const { response } = require('express');

// env variables
require('dotenv').config();

// nodemailer
let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASSWORD
    }
})

// testing nodemailer
transporter.verify((error, success) => {
    if (error) {
        console.log('error testing nodemailer', error);
    } else {
        console.log('success from testing nodemailer', success);

    }
})

const sendVerificationEmail = ({ _id, email }, res) => {
    // url to be use in the email
    const currentUrl = "http://localhost:5000/";

    const uniqueString = uuidv4() + _id;

    // mail options
    const mailOptions = {
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify your email",
        html: `<p>Verify your email address to complete the signup and login into your account</p>.<p>This link <b>expired in 6 hours</b>.</p><p>Press <a href=${currentUrl + "api/v1/members/verify/" + _id + "/" + uniqueString}>here</a> to process.</p>`,
    };
    // hash the uniqueString
    const saltRounds = 10;
    bcrypt
        .hash(uniqueString, saltRounds)
        .then((hashedUniqueString) => {
            // set value in userVerification collection
            const newVerification = new UserVerification({
                userId: _id,
                uniqueString: hashedUniqueString,
                createdAt: Date.now(),
                expiredAt: Date.now(),
                // expiredAt: Date.now() + 21600000,
            })
            newVerification
                .save()
                .then(() => {
                    transporter
                        .sendMail(mailOptions)
                        .then(() => {
                            // email sent and verification record saved
                            res.json({
                                status: "PENDING",
                                message: "Verification email sent",
                            })
                        })
                        .catch((error) => {
                            res.json({
                                status: "FAILED",
                                message: "Verification email failed: " + error.message
                            })
                        })
                })
                .catch((error) => {
                    res.json({
                        status: "FAILED",
                        message: "Couldn't save verification email data: " + error.message
                    })
                })
        })
        .catch(() => {
            res.json({
                status: "FAILED",
                message: "An error occurred while hashing email data!"
            })
        })
}


const CreateUser = async (req, res, next) => {
    try {
        const { userName, firstName, lastName, email, password, role } = req.body;
        const emailExist = await User.findOne({ email });
        const usernameExist = await User.findOne({ userName });
        if (emailExist) {
            return res.status(400).json({
                success: false,
                msg: "Email already exists"
            })
        }
        if (usernameExist) {
            return res.status(400).json({
                success: false,
                msg: "Username already exists"
            })
        }
        const newUser = new User({
            userName, firstName, lastName, email, password, role, verified: false
        });
        await newUser.save()
            .then((result) => {
                // handle account verification
                sendVerificationEmail(result, res)
            })

    } catch (error) {
        console.log(error),

            res.status(400).json({
                success: false,
                message: error.message
            })
    }
};

const VerifyEmail = async (req, res, next) => {
    const { userId, uniqueString } = req.params;
    UserVerification.
        find({ userId })
        .then((result) => {
            if (result.length > 0) {
                // user verification record exists so we process
                const { expiredAt } = result[0];
                const hashedUniqueString = result[0].uniqueString;

                // checking for expired unique string
                if (expiredAt < Date.now()) {
                    // record expired so we delete it
                    UserVerification.deleteOne({ userId })
                        .then((result) => {
                            // used {_id: userId} for User bc users collection does not have a field called userId but UserVerifications collection does
                            User.deleteOne({ _id: userId })
                                .then((result) => {
                                    console.log(`delete ${userId}`, result);
                                    let message = "Link has expired. Please sign up again";
                                    res.redirect(`/user/verified/error=true&message=${message}`);
                                })
                                .catch((error) => {
                                    console.log(error);
                                    let message = "Clearing user with expired unique string failed"; res.redirect(`/user/verified/error=true&message=${message}`);
                                });
                        })
                        .catch((error) => {
                            console.log(error);
                            let message = "An error occurred while clearing expired user verification record";
                            res.redirect(`/user/verified/error=true&message=${message}`);
                        })
                } else {
                    // valid record exists so we validate the user string
                    // first compare the hashed unique string

                    bcrypt.compare(uniqueString, hashedUniqueString)
                        .then((result) => {
                            if (result) {
                                // uniqueString = hashedUniqueString => strings match
                                User.updateOne({ _id: userId }, { verified: true })
                                    .then((result) => {
                                        UserVerification.deleteOne({
                                            userId
                                        })
                                            .then(() => {
                                                res.sendFile(path.join(__dirname, "./../views/verified.html"));
                                            })
                                            .catch((error) => {
                                                console.log(error);
                                                let message = "An error occurred while finalizing successful verification.";
                                                res.redirect(`/user/verified/error=true&message=${message}`);
                                            })
                                    })
                                    .catch((error) => {
                                        console.log(error);
                                        let message = "An error occurred while updating user record's verifying status.";
                                        res.redirect(`/user/verified/error=true&message=${message}`);
                                    })
                            } else {
                                // existing record but incorrect verification details passed
                                let message = "Invalid verification details passed. Check your inbox.";
                                res.redirect(`/user/verified/error=true&message=${message}`);
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                            let message = "An error occurred while validating unique string";
                            res.redirect(`/user/verified/error=true&message=${message}`);
                        })
                }
            } else {
                // user verification record does not exist
                let message = "Account record does not exist or has been verified already. Please sign up or log in";
                res.redirect(`/user/verified/error=true&message=${message}`);
            }
        })
        .catch((error) => {
            console.log(error);
            let message = "An error occurred while checking for existing user verification record";
            res.redirect(`/user/verified/error=true&message=${message}`);
        })
}

const VerifiedEmail = async (req, res, next) => {
    res.sendFile(path.join(__dirname, "./../views/verified.html"));
}

const LoginUser = async (req, res, next) => {
    try {
        // name of the email and password destructed from the req.body have to matched the fields of users document
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            })
        }

        // verify user email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
            })
        }
        if (!user.verified) {
            return res.status(400).json({
                success: false,
                message: "Email hasn't been verified. Please check your inbox."
            })
        }
        // verify user password
        const isMatched = await user.comparePassword(password)
        if (!isMatched) {
            return res.status(400).json({
                success: false,
                message: "Invalid credentials"
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
            message: "Cannot log in, check your credentials"
        })
    }
};

const testUser = {
    id: "123",
    email: "a@a.com",
    password: "123456"
}

const JWT_SECRET = 'tokenSecret...'

const ForgotPassword = async (req, res, next) => {
    const { email } = req.body;
    if (email !== testUser.email) {
        res.send("user not resgister")
        return;
    }
    // User exist and now create a one time link valid for 15 mins
    const secret = JWT_SECRET + testUser.password
    const payload = {
        email: testUser.email,
        id: testUser.id
    }

    const token = jwt.sign(payload, secret, { expiresIn: '15m' })
    const link = `http://localhost:5000/api/v1/members/reset-password/${testUser.id}/${token}`
    console.log(link);
    res.send("Password reset has been sent to your email...")
}

const ResetPassword = async (req, res, next) => {
    const { id, token } = req.params;

    //  check if this id exist in database
    if (id !== testUser.id) {
        res.send('Invalid id...')
        return
    }

    // we have a valid id, and have a valid user with this id
    const secret = JWT_SECRET + testUser.password
    try {
        const payload = jwt.verify(token, secret)
        // after entered an valid email, this will render the template called "reset-password" and pass an object { email: testUser.email} as a prop 
        // I'm testing on Postman by hardcode it as JSON to the body
        res.render('reset-password', { email: testUser.email })
    } catch (error) {
        console.log("from ResetPassword", error.message);
        res.send({ "err": error.message, "msg": "from ResetPassword" })
    }
}
const HandleResetPassword = async (req, res, next) => {
    const { id, token } = req.params;
    const { password, password2 } = req.body
    // check if this id exist in database
    /* 
    const user = await User.findOne({ id });

        if (!user) {
            return res.status(400).json({
                success: false,
                msg: "Invalid credentials"
            })
        }
    */
    if (id !== testUser.id) {
        res.send("invalid id...")
        return;
    }

    const secret = JWT_SECRET + testUser.password;
    try {
        const payload = jwt.verify(token, secret)

        // validate password and password2 should match
        // we can simply find the user with the payload email and id and finally update with new password
        /* 
            const payload = {
            email: testUser.email,
            id: testUser.id
            }
        */
        testUser.password = password;
        /* 
        *need more research on hashing password before update
             users.findOneAndUpdate({ _id: req.params.id }, req.body, {
       new: true,
       runValidators: true,
     })
       .then(updatedUser => {
         res.json(updatedUser)
       })
       .catch(err => {
         res.status(400).json({ message: 'Something went wrong', error: err })
       })
        */
        res.send(testUser)
    } catch (error) {
        console.log("from HandleResetPassword", error.message);
        res.send({ "err": error.message, "msg": "from HandleResetPassword" })
    }
}

module.exports = {
    CreateUser, VerifyEmail, VerifiedEmail, LoginUser, ForgotPassword, ResetPassword, HandleResetPassword
}

/* 
*FACT: token is 1 time used and manually set to expired in 15mins
TODO:
1) Figure out how to send the token to the user email 
2) How to use the token properly. Ex: Create an form to input the token? Where to apply the token correctly to make the jsonwebtoken'logic working
3)Hashing the password before saving to the db

?(THOUGHT: is it save to expose the user's id and token on the url's template? http://localhost:5000/api/v1/members/reset-password/${testUser.id}/${token}
? token could be included in the form as hidden input and send together to the req.body with the new password)
*/