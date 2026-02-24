const mongoose = require('mongoose');

const connectDB = async () => {
    const connectdb = process.env.MONGODB_URI;
    try{
        if (!connectdb) {
            throw new Error('MONGODB_URI is not configured');
        }
        await mongoose.connect(connectdb);
    }
    catch(err)
    {
        console.log(err);
    }
}

module.exports = connectDB;