const mongoose = require('mongoose');

const Userschem = new mongoose.Schema(
    {name : {type : String, required : true},
    email : {type : String, required : true, unique : true},
    password : {type : String, required : true},
    role : {type : mongoose.Schema.Types.ObjectId,
        ref : 'Role',
        required : true},
    },
    { timestamps : {createdAt: 'created_at', updatedAt: false}, collection : 'users' }
)

module.exports = mongoose.model('User', Userschem)