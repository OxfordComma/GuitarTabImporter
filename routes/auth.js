var express = require('express');
var router = express.Router();
var passport = require('passport')
// const mongoose = require('mongoose');
const User = require('../models/User')


var GoogleDriveStrategy = require('passport-google-drive').Strategy
var refresh = require('passport-oauth2-refresh');

var strategy = new GoogleDriveStrategy({
	clientID:  process.env.google_client_id, // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
	clientSecret: process.env.google_client_secret, // e.g. _ASDFA%DFASDFASDFASD#FAD-
	callbackURL: `${process.env.REDIRECT_URL}/auth/googledrive/callback`,
	scope: ['https://www.googleapis.com/auth/drive.file'],
	passReqToCallback: true,
	authType: 'rerequest', 
	accessType: 'offline', 
	// prompt: 'consent', 
	includeGrantedScopes: true
},
async function(request, accessToken, refreshToken, profile, done) {
	console.log(profile.email)
	var currentUser = await User.findOne({ email: profile.email }).exec()
	console.log(currentUser)
	console.log(currentUser ? 'true' : 'false')
	if (currentUser) {
		// if we already have a record with the given profile ID
		done(null, currentUser);
	} else {
		 //if not, create a new user 
		 console.log(profile.folder)
		new User({
			accessToken: accessToken,
			refreshToken: refreshToken,
			email: profile.email,
			folder: '/'
		}).save().then((newUser) =>{
			done(null, newUser);
		});
	}
})

passport.use(strategy);
refresh.use(strategy);

passport.serializeUser(function(user, done) {
	console.log(user)
	done(null, user._id );
});

passport.deserializeUser(function(id, done) {
	console.log(id)
	User.findOne({ _id: id }, function (err, user) {
		if (err) { 
			console.log(err) 
		}
		console.log(user)
		done(null, user);
	});
});


// Google drive authentication
router.get('/googledrive', 
	passport.authenticate('google-drive', {
		prompt: 'consent',
		accessType: 'offline',
		scope: ['https://www.googleapis.com/auth/drive.file']
	})
);

router.get('/googledrive/callback', passport.authenticate('google-drive'),
	function(req, res) {
		console.log(req.user)
		
		res.redirect('/import')
	}
)

module.exports = router;