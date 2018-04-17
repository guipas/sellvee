'use strict';

const express = require('express');
const _ = require('lodash');
const uuid = require('uuid');
const moment = require('moment');
const crypto = require('crypto');
const util = require('util');
const randomBytes = util.promisify(crypto.randomBytes);
const router = express.Router();
const storage = require('../lib/storage');
const am = require('../lib/asyncMiddleware');


module.exports = config => {
  const stripe = require("stripe")(config.stripe.secretKey);// eslint-disable-line
  const log = (...args) => config.log === true ? console.log(...args) : null;// eslint-disable-line
  const mailer = require('../lib/mailer')(config);// eslint-disable-line

  router.get(`/product/:slug`, (req, res, next) => {
    const product = _.find(config.products, { slug : req.params.slug });
    if (!product) { return next(); }

    return res.render('product', {
      product,
      publicKey : config.stripe.publicKey,
    });
  });

  router.post('/order', am(async (req, res, next) => {

    // Token is created using Checkout or Elements!
    // Get the payment token ID submitted by the form:
    const stripeToken = req.body.stripeToken; // Using Express
    const product = _.find(config.products, { id : req.body.product });
    const email = req.body.email;
    log(`Ordering product : `, product);

    const currency = product.currency ? product.currency : config.currency;

    log(`Currency : `, currency);

    if (!product) {
      log(`Product not found`);
      return next('Product Not found');
    }

    const charge = await new Promise((resolve, reject) => {
      stripe.charges.create({
        amount: parseInt(product.price * 100, 10), // stripe amounts are in cents
        description: `${product.name} - ${config.name}`,
        source: stripeToken,
        currency,
      }, (err, charge) => {
        if (err) return reject(err);

        return resolve(charge);
      });
    });

    log(`Generating download token...`);
    const randomBytesBuffer = await randomBytes(48);
    const downloadToken = randomBytesBuffer.toString('hex');
    const id = uuid.v4();

    log(`Saving order`);
    await storage.setItem(`order:${id}`, {
      id,
      charge,
      token : downloadToken,
      nbAccess : 0,
      productId : product.id,
      createdAt : moment().toISOString(),
      email,
    });

    log(`Generating link...`);
    const link = `${config.url}/download/${id}/${downloadToken}`;

    log('Sending email...');
    await mailer.sendMail({
      from: config.emails.from,
      to: email,
      subject: typeof config.emails.templates.order.subject === `function` ? config.emails.templates.order.subject({ link }) :  config.emails.templates.order.subject,
      html: typeof config.emails.templates.order.htmlBody === `function` ?   config.emails.templates.order.htmlBody({ link }) : config.emails.templates.order.htmlBody,
      text: typeof config.emails.templates.order.textBody === `function` ?   config.emails.templates.order.textBody({ link }) : config.emails.templates.order.textBody,
    });

    res.render('success');
  }));

  router.get('/download/:order/:token', am(async (req, res, next) => {
    log(`Download attempt...`);
    const id = req.params.order;
    const token = req.params.token;
    if (!token || !id) { return next(); }

    const key = `order:${id}`;
    const order = await storage.getItem(key);
    if (!order) { return next(); }

    log('Found order : ', order.id);

    order.nbAccess += 1;

    if (order.token !== token) {
      await storage.setItem(key, order);
      return next();
    }

    const product = _.find(config.products, { id : order.productId });

    if (!product) {
      await storage.setItem(key, order);
      return next('Sorry, this product does not exist anymore');
    }

    const maxDownloads = product.maxDownloads ? product.maxDownloads : config.maxDownloads;
    const maxDownloadDelay = product.maxDownloadDelay ? product.maxDownloadDelay : config.maxDownloadDelay;
    const createdAt = moment(product.createdAt);
    const expiredAt = createdAt.clone().add(maxDownloadDelay, `seconds`);

    log(`Downloads : `, order.nbAccess, '/', maxDownloads);
    log(`Max delay : `, maxDownloadDelay);
    if (order.nbAccess > maxDownloads || moment().isAfter(expiredAt)) {
      await storage.setItem(key, order);
      return next();
    }

    await storage.setItem(key, order);

    log(`Download autorization granted, sending file...`);
    return res.download(product.file);
  }));

  return router;
};

