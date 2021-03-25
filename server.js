const express = require('express'); //Brings in the express library.
const app = express(); //allows us to have access to express library functions
const { pool } = require('./views/dbConfig'); //access to pg, created in dbConfig file
const bcrypt = require('bcrypt'); //allows us to hash passwords
const morgan = require('morgan'); //logger which generates request logs library
const session = require('express-session'); //store user session, track what users do on the program, stores info for a specific client
const flash = require('express-flash'); //ability to display flash messages
const passport = require('passport'); //allows us to store logged in users session details into the browser cookie,
//so that they can be authenticated user
const path = require('path'); //find file paths using nodejs
const bodyParser = require('body-parser'); // allows us to handle http and post requests in express.js
const cons = require('consolidate'); // enables us to use template engines
const dust = require('dustjs-helpers'); //usage of dust template engine

//get other files on my machine...logos and images in other folders

//Assign Dust Engine to .dust Files
app.engine('dust', cons.dust);

app.use(express.static('public'));
app.use('/css', express.static(__dirname + 'public/css'));
app.use('/Logo', express.static(__dirname + 'public/Logo'));
app.use('/images', express.static(__dirname + 'public/images'));
app.use(morgan('dev'));
const initializePassport = require('./views/passportConfig');

//Set Default Ext .dust
app.set('view engine', 'dust');
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs'); //middleware to use ejs view engine for us to render ejs files
app.use(express.urlencoded({ extended: false })); //middleware sends details from front end to server ex
// email, name, password details to server.
//Set Public Folder
//app.use(express.static(path.join(__dirname, 'public')));

//Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

initializePassport(passport); //initializing passport we required at the top of the page.

const PORT = process.env.PORT || 4000; //setting up environment and port to be used

app.use(
	session({
		secret: 'secret', //key we want to keep secret, encrypt and store info in our session

		resave: false, //should we resave session variables if nothing changes

		saveUninitialized: false, //should we save session variables if nothing is placed in session
	})
);
app.use(passport.initialize()); // we want app to use passport
app.use(passport.session());

app.use(flash()); // to display our flash messages

// app.get("/ejs", function(req, res) {
//     res.render('ejs_template.ejs', {header: 'EJS - TEST OK'});
// });

app.get('/', (req, res) => {
	//setting up page and link to specific file.
	res.render('index.ejs');
});

app.get('/users/register', checkAuthenticated, (req, res) => {
	//setting up page and link to specific file.
	res.render('register.ejs');
});

app.get('/users/login', checkAuthenticated, (req, res) => {
	//setting up page and link to specific file.
	res.render('login.ejs');
});

app.get('/users/dashboard', checkNotAuthenticated, (req, res) => {
	//setting up page, linking it to specs file
	res.render('dashboard.ejs', { user: req.user.name }); //setting up user from ejs code in dashboard file.
}); //taking user from database

app.get('/users/about', (req, res) => {
	//setting up page and link to specific file.
	res.render('about.ejs');
});

app.get('/users/sales', checkNotAuthenticated, (req, res) => {
	//setting up page and link to specific file.
	res.render('sales.ejs');
});

app.get('/users/sales2', (req, res) => {
	//PG Connect
	pool.connect(function (err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		client.query('SELECT * FROM customers', function (err, result) {
			if (err) {
				return console.error('error running query', err);
			}
			res.render('sales2.dust', { customers: result.rows });
			done();
		});
	});

	//res.render('sales2.dust', { header: 'DUST - TEST OK' });
});



app.get('/users/logout', (req, res) => {
	// log out messages and flash and passport functions
	req.logOut();
	req.flash('success_msg', 'You have logged out');
	res.redirect('/users/login');
});

app.post('/users/register', async (req, res) => {
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
		errors.push({ message: 'Please enter all fields' });
	}
	if (password.length < 6) {
		errors.push({ message: 'Password should be atleast 6 characters' });
	}
	if (password != password2) {
		errors.push({ message: 'Passwords do not match' });
	}

	if (errors.length > 0) {
		// if errors exist run the register file and show errors.
		res.render('register.ejs', { errors });
	} else {
		// Form validation has passed
		let hashedPassword = await bcrypt.hash(password, 10); //if all went well hash the password
		console.log(hashedPassword);

		pool.query(
			'SELECT * FROM users WHERE email = $1', //check to see if person registering already exists
			[email], // in our database
			(err, results) => {
				if (err) {
					throw err;
				}

				console.log(results.rows); //shows list of registered users in database
				if (results.rows.length > 0) {
					errors.push({ message: 'Email already registered' });
					res.render('register.ejs', { errors });
				} else {
					pool.query(
						`INSERT INTO users (name, email, password)
					     VALUES ($1, $2, $3)
						 RETURNING id, password`,
						[name, email, hashedPassword], // replace 1, 2, 3 with these values
						(err, results) => {
							if (err) {
								throw err;
							}
							console.log(results.rows);
							req.flash('success_msg', 'You are now registered. Please log in');
							res.redirect('/users/login');
						}
					);
				}
			}
		);
	}
});

app.post(
	'/users/login',
	passport.authenticate('local', {
		successRedirect: '/users/dashboard', //if login successfull
		failureRedirect: '/users/login', // if login fail
		failureFlash: true, // failure flash message will appear
	})
);

//Sales page

app.post('/users/sales', async (req, res) => {
	let {
		firstname,
		lastname,
		country,
		city,
		province,
		postalcode,
		email,
		age,
		date,
		gender,
		request,
		file,
		phone,
		url,
		requeststatus,
	} = req.body; //get info from our sales form send it to server

	console.log({
		firstname,
		lastname, // log login details to console
		country,
		city,
		province,
		postalcode,
		email,
		age,
		date,
		gender,
		request,
		file,
		phone,
		url,
		requeststatus,
	});
	let errors = []; // any errors will be pushed to this array

	if (
		!firstname ||
		!lastname ||
		!country ||
		!city ||
		!province ||
		!postalcode ||
		!email ||
		!age ||
		!date ||
		!gender ||
		!request ||
		!phone ||
		!url
	) {
		// error validations for sales info
		errors.push({ message: 'Please enter all fields' });
	}

	if (errors.length > 0) {
		// if errors exist run the register file and show errors.
		res.render('sales.ejs', { errors });
	} else {
		pool.query(
			'SELECT * FROM customers WHERE email = $1', //check to see if customer already exists
			[email], // in our database
			(err, results) => {
				if (err) {
					throw err;
				}

				console.log(results.rows); //shows list of registered customers in database
				if (results.rows.length > 0) {
					errors.push({ message: 'Customer already exists' });
					res.render('sales', { errors });
				} else {
					pool.query(
						`INSERT INTO customers (firstname, lastname, country, city, province, postalcode, email, age, date,
						gender,request, file, phone, url, requeststatus)
					     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
						 RETURNING id`,
						[
							firstname,
							lastname,
							country,
							city,
							province,
							postalcode,
							email,
							age,
							date,
							gender,
							request,
							file,
							phone,
							url,
							requeststatus,
						], // replace 1, 2, 3 with these values
						(err, results) => {
							if (err) {
								throw err;
							}
							console.log(results.rows);
							req.flash('success_msg', 'You are now registered.');
							res.redirect('/users/sales');
						}
					);
				}
			}
		);
	}
});
app.post('/users/edit', function (req, res) {
	pool.connect(function (err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		client.query(
			'UPDATE customers SET firstname=$1, lastname=$2, country=$3, city=$4, province=$5, postalcode=$6, email=$7, age=$8, date=$9, gender=$10, request=$11, file=$12, phone=$13, url=$14, requeststatus=$15 WHERE id=$16',
			[
				req.body.firstname,
				req.body.lastname,
				req.body.country,
				req.body.city,
				req.body.province,
				req.body.postalcode,
				req.body.email,
				req.body.age,
				req.body.date,
				req.body.gender,
				req.body.request,
				req.body.file,
				req.body.phone,
				req.body.url,
				req.body.requeststatus,
				req.body.id,
			]
		);

		done();
		res.redirect('/users/sales2');
	});
});
app.delete('/users/sales2/delete/:id', function (req, res) {
	//handle request to delete
	pool.connect(function (err, client, done) {
		if (err) {
			return console.error('error fetching client from pool', err);
		}
		client.query('DELETE FROM customers WHERE id =$1', [req.params.id]);
		done();
		res.send(200);
	});
});

function checkAuthenticated(req, res, next) {
	//checks if user is authenticated or passport function
	if (req.isAuthenticated()) {
		return res.redirect('/users/dashboard');
	}
	next(); // move on to next middleware
}
function checkNotAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('/users/login');
}

app.listen(PORT, () => {
	console.log('Server running on port ${PORT}'); //creating a server using express
});
