var express = require('express');
var router = express.Router();
var passport = require('passport')
const mongoose = require('mongoose');
const User = require('../models/User')


var GoogleDriveStrategy = require('passport-google-drive').Strategy
var refresh = require('passport-oauth2-refresh');

var strategy = 
    new GoogleDriveStrategy({
        clientID:  process.env.google_client_id, // e.g. asdfghjkljhgfdsghjk.apps.googleusercontent.com
        clientSecret: process.env.google_client_secret, // e.g. _ASDFA%DFASDFASDFASD#FAD-
        callbackURL: '/auth/googledrive/callback',
        scope: ['https://www.googleapis.com/auth/drive.readonly'],
        passReqToCallback: true,
        authType: 'rerequest', 
        // accessType: 'offline', 
        // prompt: 'consent', 
        includeGrantedScopes: true
    },
    async function(request, accessToken, refreshToken, profile, done) {
        var currentUser = await User.findOne({email: profile.email })//.then((currentUser) => {
        console.log(currentUser)
        if (currentUser) {
          //if we already have a record with the given profile ID
          done(null, currentUser);
        } else{
             //if not, create a new user 
            new User({
                // googleId: profile.id,
              accessToken: accessToken,
              refreshToken: refreshToken,
              email: profile.email
            }).save().then((newUser) =>{
              done(null, newUser);
            });
         } 
      // })
        // console.log(profile)
        // return done(null, {
        //     google: {
        //         accessToken: accessToken,
        //         refreshToken: refreshToken,
        //         email: profile.email
        //     }
        // });
    })
passport.use(strategy);
refresh.use(strategy);

passport.serializeUser(function(user, done) {
    // console.log(user)
    // User.serializeUser()
    done(null, user);
});

passport.deserializeUser(function(id, done) {
    console.log(id)
    User.findById(id, function (err, user) {
      if (err) { console.log(err) }
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
        // console.log(req.session)
        res.redirect('/import')
    }
)

module.exports = router;