const mongosse = require('mongoose');

const Roleschema = new mongosse.Schema(
    {
        name: {
            type: String,
            enum: ['MANAGER', 'SUPPORT', 'USER'],
            required: true,
            unique: true,
        },
    },
    { collection: 'roles' }
);

module.exports = mongosse.model('Role', Roleschema);
