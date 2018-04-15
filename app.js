'use strict';

const express = require('express');
const path = require('path');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const merge = require('deepmerge');

const defaultConfig = require('./default.config');
const storage = require('./lib/storage');
const index = require('./routes/index');
const translate = require('./lib/translate');

require('./lib/mailer');

const app = express();

module.exports = (userConfig = {}) => {
  const config = merge(defaultConfig, userConfig);

  app.set(`env`, config.env);

  // view engine setup
  app.set('views', path.join(__dirname, 'views'));
  if (config.views) {
    app.set('views', [
      config.views,
      path.join(__dirname, 'views'),
    ]);
  }
  app.set('view engine', 'ejs');

  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));


  app.use('/', (req, res, next) => {
    res.locals.config = config;
    res.locals._t = translate(config);
    next();
  });

  storage.init({
    dir: path.join(__dirname, 'persist'),
    stringify: JSON.stringify,
    parse: JSON.parse,
    encoding: 'utf8',
    logging: false,  // can also be custom logging function
    continuous: true, // continously persist to disk
    interval: false, // milliseconds, persist to disk on an interval
    ttl: false, // ttl, can be true for 24h default or a number in MILLISECONDS
  })
  .then(() => {
    console.log('Storage inited');
    app.use('/', index(config));
    // catch 404 and forward to error handler
    app.use((req, res, next) => {
      const err = new Error('Not Found');
      err.status = 404;
      next(err);
    });

    // error handler
    app.use((err, req, res, next) => {
      // set locals, only providing error in development
      res.locals.message = err.message;
      res.locals.error = req.app.get('env') === 'development' ? err : {};

      // render the error page
      res.status(err.status || 500);
      res.render('error');
    });

  });

  return app;
};
