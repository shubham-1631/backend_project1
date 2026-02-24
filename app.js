require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');
const roleRoute = require('./routes/roles');
const userRoute = require('./routes/user');
const ticketRoute = require('./routes/ticket');
const authRoute = require('./routes/auth');
const commentRoute = require('./routes/comment');

const app = express();
app.use(express.json());

connectDB();

app.use('/auth', authRoute);
app.use('/roles', roleRoute);
app.use('/users', userRoute);
app.use('/tickets', ticketRoute);
app.use('/comments', commentRoute);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});