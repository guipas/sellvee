'use strict';

// handle middlewares that return promises (or async middlewares)
const asyncMiddleware = middleware => (req, res, next) => middleware(req, res, next).catch(err => { console.error(err); next(err); });

module.exports = asyncMiddleware;
