const mongoose = require('mongoose');
const databaseConfig = require(__path_configs +'database');

const schema = new mongoose.Schema({
     name: String, 
     status: String,
     ordering: Number,
     content: String,
     avatar: String,
     username:String,
     password: String,
     group: {
      id: String,
      name: String
     },
     created: {
        user_id: Number,
        user_name: String,
        time: Date
     },
     modified: {
        user_id: Number,
        user_name: String,
        time: Date
     }
    });

module.exports = mongoose.model(databaseConfig.col_users, schema);

// {
//     "name": "Javascript",
//     "status": "active",
//     "ordering" : 6
// }