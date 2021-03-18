require('dotenv').config(); //env used to store database credentials, we take info from our .env file

const { Pool } = require('pg'); //pg is used to connect nodejs to postgresql

const isProduction = process.env.NODE_ENV === 'production'; //look to see if app is hosted in production, if in development it gets set to false
//this is for setting up the environment we are working in, currently
// this is for our final production environment.

const connectionString =
	//'postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}'
	'postgresql://postgres:password@localhost:5432/nodelogin';
//connecting postgresql database to my nodejs .env file
const pool = new Pool({
	connectionString: isProduction ? process.env.DATABASE_URL : connectionString, //inialize a new pool
	//connecting to database
});

module.exports = { pool }; //export pool to be used in other areas of the program
module.export = connectionString;
