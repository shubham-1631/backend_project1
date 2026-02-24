const mongosse = require('mongoose');

const Ticcommentschema = new mongosse.Schema(
    {
        ticket : {type : mongosse.Schema.Types.ObjectId, 
            ref : 'Ticket', 
            required : true},
        user : { type : mongosse.Schema.Types.ObjectId,
            ref : 'User',
            required : true},
        comment : {type : String, required : true},
    },
    { timestamps : {createdAt : 'created_at', updatedAt : false}, 
      collection : 'ticketcomments' 
    }
);

module.exports = mongosse.model('Ticketcomment', Ticcommentschema);