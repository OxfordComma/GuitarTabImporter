const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GoogleDriveStrategy = require('passport-google-drive').Strategy;
module.exports = (passport) => {
    passport.serializeUser((user, done) => {
        done(null, user);
    });
    passport.deserializeUser((user, done) => {
        done(null, user);
    });
    passport.use(new GoogleDriveStrategy({
        clientID: '296193245260-prmltutuorpem0knakev0t4q1m709srh.apps.googleusercontent.com',
        clientSecret: 'uDgP8aW5FE6phAfBWzBuYAG4',
        callbackURL: 'http://localhost:3000/import/auth/google/callback'
    },
    (token, refresh_token, profile, done) => {
        user = {};
        user.token = token;
        user.refresh_token = refresh_token;
        user.profile = profile;
        return done(null, user)
    }));
};