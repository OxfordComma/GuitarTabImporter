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
        clientID: 'CLIENT_ID',
        clientSecret: 'CLIENT_SECRET',
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
