const LocalStrategy = require("passport-local").Strategy; //passport setup
const pool = require("./dbConfig"); //need access to database
const bcrypt = require("bcrypt"); //need to compare hashed password with password being inputted.

function initialize(passport) {
	
	const authenticateUser = (email, password, done) => {
		
		const qt = {
			text: `SELECT * FROM users WHERE email = email`, //check database to see if user exists
			
		}
		pool.query(
			qt,
			(err, results) => {
				if (err) {
				//	console.log(err);
					
					throw err;
				}
			//	console.log(results.row);

				if (results.rows.length > 0) {
					//found a user in database
					const user = results.rows[0]; //first value found takes the user value from the database

					bcrypt.compare(password, user.password, (err, isMatch) => {
						//compare log in password with password in database
						if (err) {
							throw err;
						}
						if (isMatch) {
							return done(null, user); //no error return user
						} else {
							return done(null, false, { message: "Password is not correct" });
						}
					});
				} else {
					return done(null, false, { message: "Email is not registered" }); //if no users in the database run this
				}
			}
		);
	};

	passport.use(
		new LocalStrategy(
			{
				usernameField: "email",
				passwordField: "password",
			},
			authenticateUser
		)
	);
	passport.serializeUser((user, done) => done(null, user.id)); //stores session user and session cookie

	passport.deserializeUser((id, done) => {
		pool.query(`SELECT * FROM users WHERE id=$1`, [id], (err, results) => {
			//uses the id to get user details from database
			if (err) {
				//and store full object into the session
				throw err;
			}
			return done(null, results.rows[0]);
		});
	});
}
module.exports = initialize; //to use function in server
