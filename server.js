const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const express = require('express');
const app = express();
const port = process.env.port || 5000;
const DB = process.env.MONGODB_URI;
const createUserRoute = require('./routes/users');
app.use(express.json());
app.use('/api/v1/members', createUserRoute);



// Connect to database and Server
const startUp = () => {
    try {
        mongoose.connect(DB);
        app.listen(port, ()=> {
            console.log(`440club server running on port ${port}...\nConnected to 440club Members Database`)
        })
    } catch (error) {
        console.log(error);
    };
};

startUp();
