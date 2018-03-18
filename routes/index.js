'use strict';

const express = require('express');
const _ = require('lodash');
const uuid = require('uuid');
const moment = require('moment');
const crypto = require('crypto');
const util = require('util');
const randomBytes = util.promisify(crypto.randomBytes);
const router = express.Router();
// Set your secret key: remember to change this to your live secret key in production
// See your keys here: https://dashboard.stripe.com/account/apikeys
const secretKey = `sk_test_0poc1Q6Xa4z8svfECCNOiyP2`;
const publicKey  = `pk_test_3dt3dTXVME1yLzZQPctBtV1S`;
const stripe = require("stripe")(secretKey);

const config = require('../config');
const products = require('../products');
const storage = require('../lib/storage');
const mailer = require('../lib/mailer');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get(`/product/:slug`, (req, res, next) => {
  const product = _.find(products, { slug : req.params.slug });
  if (!product) { return next(); }

  return res.render('product', {
    product,
    publicKey
  });
});

router.post('/charge', (req, res, next) => {

  console.log(`products : `, products);
  console.log(`body : `, req.body);

  // Token is created using Checkout or Elements!
  // Get the payment token ID submitted by the form:
  const token = req.body.stripeToken; // Using Express
  const product = _.find(products, { id : req.body.product });
  const email = req.body.email;
  console.log(`charging for product : `, product);


  const currency = product.currency ? product.currency : config.currency;

  console.log(`currency : `, currency);

  if (!product) {
    return next('Product Not found');
  }

  // Charge the user's card:
  stripe.charges.create({
    amount: parseInt(product.price * 100, 10), // stripe amounts are in cents
    description: `${product.name} - ${config.name}`,
    source: token,
    currency,
  }, (err, charge) => {
    if (err) {
      return next(err);
    }
    console.log('charge : ', charge);

    return randomBytes(48)
    .catch(err => {
      return next(err);
    })
    .then(buffer => buffer.toString('hex'))
    .then(token => {
      console.log(`Generated token : `, token);
      const id = uuid.v4();

      return storage.setItem(`order:${id}`, {
        id,
        charge,
        token,
        nbAccess : 0,
        productId : product.id,
        createdAt : moment().toISOString(),
        email,
      });
    })
    .then(items => {
      console.log('persisted items :', items);
      const item = Array.isArray(items) ? items[0].value : items;
      console.log('item :', item);
      const link = `${config.url}/download/${item.id}/${item.token}`;
      return mailer.sendMail({
        from: config.fromEmail,
        to: email,
        subject: `Votre commande sur ${config.name}`, // Subject line
        text: `Thanks for your order, you can download it here : ${link}`, // plain text body
        html: `Thanks for your order, you can download it here : <a href="${link}"></a>`, // html body
      })
      .then(() => {
        res.send(`Your order has been processed`);
      });
    })
    .catch(err => {
      next(err);
    })
  });
});


router.get('/download/:order/:token', (req, res, next) => {
  const id = req.params.order;
  const token = req.params.token;
  const key = `order:${id}`;

  if (!token || !id) { return next(); }

  return storage.getItem(key)
  .then(order => {
    if (!order) { return next(); }

    console.log('Found order : ', order);

    order.nbAccess += 1;

    if (order.token !== token) {
      return storage.setItem(key, order).then(() => next());
    }

    const product = _.find(products, { id : order.productId });

    if (!product) {
      return storage.setItem(key, order).then(() => next('Sorry, this product does not exist anymore'));
    }

    const maxDownloads = product.maxDownloads ? product.maxDownloads : config.maxDownloads;
    const maxDownloadDelay = product.maxDownloadDelay ? product.maxDownloadDelay : config.maxDownloadDelay;
    const createdAt = moment(product.createdAt);
    const expiredAt = createdAt.clone().add(maxDownloadDelay, `seconds`);

    console.log(`downmoads : `, order.nbAccess, '/', maxDownloads);
    console.log(`max delay : `, maxDownloadDelay);
    if (order.nbAccess > maxDownloads || moment().isAfter(expiredAt)) {
      return storage.setItem(key, order).then(() => next());
    }

    return storage.setItem(key, order).then(() => res.sendFile(product.file));
  })
  .catch(err => next());
});


module.exports = router;
