const mongoose = require('mongoose');

const Ticketschema = new mongoose.Schema(
    {
        title : {type : String, required : true},
        description : {type : String, required : true},
        status : {type : String,
            enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
            default: 'OPEN',
        },
        priority :{
            type : String,
            enum : ['LOW', 'MEDIUM', 'HIGH'],
            default : 'MEDIUM',
        },
        created_by : {type : mongoose.Schema.Types.ObjectId, 
            ref : 'User', 
            required : true},
        assigned_to : {type : mongoose.Schema.Types.ObjectId,
            ref : 'User',
            default : null},
    },
    { timestamps : true, collection : 'tickets' }
);

module.exports = mongoose.model('Ticket', Ticketschema)