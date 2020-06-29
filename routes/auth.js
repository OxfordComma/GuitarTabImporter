var express = require('express');
var router = express.Router();
var passport = require('passport')

var GoogleDriveStrategy = require('passport-google-drive').Strategy

passport.use(
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
    function(request, accessToken, refreshToken, profile, done) { 
        // console.log(profile)
        return done(null, {
            google: {
                accessToken: accessToken,
                refreshToken: refreshToken,
                email: profile.email
            }
        });
    }
));


passport.serializeUser(function(user, cb) {
    // console.log(user)
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {

    // db.users.findById(id, function (err, user) {
    //   if (err) { return cb(err); }
        cb(null, obj);
    // });
});


router.get('/login', 
    function(req, res, next) {
        console.log(req.session)
        next()

    }, 
    passport.authenticate(['google-drive', 'spotify']),
    function(req, res) {
        console.log(req.session)
    }
);

// Google drive authentication

router.get('/googledrive', passport.authenticate('google-drive', {
        prompt: 'consent',
        accessType: 'offline',
        scope: ['https://www.googleapis.com/auth/drive']
    })
);

router.get('/googledrive/callback', passport.authenticate('google-drive'),
    function(req, res, next) {
        // console.log(req)
        res.redirect(req.session.return)
    }
)

module.exports = router;