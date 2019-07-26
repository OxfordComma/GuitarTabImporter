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
        clientID: process.env.client_id,
        clientSecret: process.env.client_id,
        callbackURL: 'http://guitartabimporter.herokuapp.com/import/auth/google/callback'
    },
    (token, refresh_token, profile, done) => {
        user = {};
        user.token = token;
        user.refresh_token = refresh_token;
        user.profile = profile;
        return done(null, user)
    }));
};
