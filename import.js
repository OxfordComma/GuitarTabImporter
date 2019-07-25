const express = require('express'),
    app = express(),
    passport = require('passport'),
    auth = require('./auth');
auth(passport);
app.use(passport.initialize());

app.get('/', (req, res) => {
    res.json({
        status: 'session cookie not set'
    });
});

app.get('/auth/google', passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/drive.file', 
            'https://www.googleapis.com/auth/drive.readonly',
            'https://www.googleapis.com/auth/documents.readonly']
}));
app.get('/auth/google/callback',
    passport.authenticate('google', {
        failureRedirect: '/'
    }),
    (req, res) => {
        console.log('success')
    }
);
