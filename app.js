// require('dotenv').config()
// var createError = require('http-errors');
// var express = require('express');
// var path = require('path');
// var cookieParser = require('cookie-parser');
// var logger = require('morgan');
// var passport = require('passport')
// var session = require('express-session')
// var helmet = require('helmet')

// var indexRouter = require('./routes/index')
// var authRouter = require('./routes/auth')
// var importRouter = require('./routes/import')
// require('./models/User')

// var app = express();

// // view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'pug');
// app.enable("trust proxy");


// app.use(session({
//   secret: 'guitartabs',
//   name: 'guitar_tab_importer',
//   resave: false,
//   saveUninitialized: true,
//   cookie: { secure: true },
//   // httpOnly: true
// }))

// app.use(logger('dev'));
// app.use(express.json());
// app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
// app.use(express.static(path.join(__dirname, 'public')));
// app.use(passport.initialize());
// app.use(passport.session())
// app.use(helmet())


// app.use('/', indexRouter);
// // app.use('/import', importRouter)
// app.use('/auth', authRouter)

// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// module.exports = app;
