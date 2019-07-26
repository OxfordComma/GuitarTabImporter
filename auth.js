const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const GoogleDriveStrategy = require('passport-google-drive').Strategy;
const fs = require('fs')
module.exports = (passport) => {
        passport.serializeUser((user, done) => {
        done(null, user);
    });
    passport.deserializeUser((user, done) => {
        done(null, user);
    });

    fs.readFile('credentials.json', (err, content) => {
      if (err) return console.log('Error loading credentials file:', err);
        const credentials = JSON.parse(content);
        const client_id = credentials.web.client_id;
        const client_secret = credentials.web.client_secret;


        passport.use(new GoogleDriveStrategy({
            clientID: process.env.client_id || client_id,
            clientSecret: process.env.client_secret || client_secret,
            callbackURL: 'https://guitartabimporter.herokuapp.com/import/auth/google/callback'
        },
        (token, refresh_token, profile, done) => {
            user = {};
            user.token = token;
            user.refresh_token = refresh_token;
            user.profile = profile;
            return done(null, user)
        }));
    });
};
