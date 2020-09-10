const express = require("express"); //Brings in the express library.
const app = express(); //allows us to have access to express library functions
const { pool } = require("./views/dbConfig"); //access to pg, created in dbConfig file
const bcrypt = require("bcrypt"); //allows us to hash passwords
const session = require("express-session");
const flash = require("express-flash");
const passport = require("passport");

const initializePassport = require("./views/passportConfig");

initializePassport(passport);

const PORT = process.env.PORT || 4000; //setting up environment and port to be used

app.set("view engine", "ejs"); //middleware to use ejs view engine for us to render ejs files
app.use(express.urlencoded({ extended: false })); //middleware sends details from front end to server ex
// email, name, password details to server.

app.use(
	session({
		secret: "secret",

		resave: false,

		saveUninitialized: false,
	})
);
app.use(passport.initialize());
app.use(passport.session());

app.use(flash());

app.get("/", (req, res) => {
	//setting up page and link to specific file.
	res.render("index");
});

app.get("/users/register", checkAuthenticated, (req, res) => {
	//setting up page and link to specific file.
	res.render("register");
});

app.get("/users/login", checkAuthenticated, (req, res) => {
	//setting up page and link to specific file.
	res.render("login");
});

app.get("/users/dashboard", checkNotAuthenticated, (req, res) => {
	//setting up page, linking it to specs file
	res.render("dashboard", { user: req.user.name }); //setting up user from ejs code in dashboard file.
});

app.get("/users/logout", (req, res) => {
	req.logOut();
	req.flash("success_msg", "You have logged out");
	res.redirect("/users/login");
});

app.post("/users/register", async (req, res) => {
	let { name, email, password, password2 } = req.body; //get info from our register form send it to server

	console.log({
		name,
		email, // log login details to console
		password,
		password2,
	});
	let errors = []; // any errors will be pushed to this array

	if (!name || !email || !password || !password2) {
		// error validations for login info
		errors.push({ message: "Please enter all fields" });
	}
	if (password.length < 6) {
		errors.push({ message: "Password should be atleast 6 characters" });
	}
	if (password != password2) {
		errors.push({ message: "Passwords do not match" });
	}

	if (errors.length > 0) {
		// if errors exist run the register file and show errors.
		res.render("register", { errors });
	} else {
		// Form validation has passed
		let hashedPassword = await bcrypt.hash(password, 10); //if all went well hash the password
		console.log(hashedPassword);

		pool.query(
			"SELECT * FROM users WHERE email = $1", //check to see if person registering already exists
			[email], // in our database
			(err, results) => {
				if (err) {
					throw err;
				}

				console.log(results.rows);
				if (results.rows.length > 0) {
					errors.push({ message: "Email already registered" });
					res.render("register", { errors });
				} else {
					pool.query(
						`INSERT INTO users (name, email, password)
					     VALUES ($1, $2, $3)
						 RETURNING id, password`,
						[name, email, hashedPassword],
						(err, results) => {
							if (err) {
								throw err;
							}
							console.log(results.rows);
							req.flash("success_msg", "You are now registered. Please log in");
							res.redirect("/users/login");
						}
					);
				}
			}
		);
	}
});

app.post(
	"/users/login",
	passport.authenticate("local", {
		successRedirect: "/users/dashboard",
		failureRedirect: "/users/login",
		failureFlash: true,
	})
);

function checkAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect("/users/dashboard");
	}
	next();
}
function checkNotAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect("/users/login");
}

app.listen(PORT, () => {
	console.log("Server running on port ${PORT}"); //creating a server using express
});
