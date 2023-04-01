require('dotenv').config();
const mysql = require("mysql");

const db = mysql.createConnection({
    host    :   process.env.DATABASE_HOST,
    user    :   process.env.DATABASE_USER,
    password:   process.env.DATABASE_PASSWORD,
    database:   process.env.DATABSE_DATABASE
})

module.exports = db;