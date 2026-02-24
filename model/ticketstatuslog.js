const mongosse = require('mongoose');

const Ticstatuslogschema = new mongosse.Schema(
    {
        ticket : {type : mongosse.Schema.Types.ObjectId,
            ref : 'Ticket',
            required : true},
        old_status: {
            type : String,
            enum : ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
            required : true,
        },
        new_status: {
            type : String,
            enum : ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
            required : true,
        },
        changed_by : {type : mongosse.Schema.Types.ObjectId,
            ref : 'User',
            required : true
        },
        changed_at : {type : Date, default : Date.now},
    },
    {collection : 'ticketstatuslogs'}
);

module.exports = mongosse.model('Ticketstatuslog', Ticstatuslogschema);