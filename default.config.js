'use strict';

const path = require('path');

module.exports = {
  env : process.env.NODE_ENV || 'production',
  url : `http://localhost:3000`,
  dataDir : path.join(__dirname, 'persist'),
  name : `Shop`,
  contactEmail : null,
  currency : `usd`, // default stripe currency for products
  maxDownloads : 3,
  maxDownloadDelay : 24 * 3600,
  views : path.join(__dirname, 'views'),
  locale : `en`,
  log : process.env.NODE_ENV === `development`,
  stripe : {
    publicKey : null,
    secretKey : null,
  },
  emails : {
    from : null,
    templates : {
      order : {
        subject : `Your order`,
        htmlBody : ({ link }) => `Thank you for your order, click on the following link to download it : <br> <a href="${link}">${link}</a>`,
        textBody : ({ link }) => `Thank you for your order, click on the following link to download it : : ${link}`,
      },
    },
    mailer: process.env.NODE_ENV === 'production' ? 'SendGrid' : 'Dev',
  },
  products : [
    // {
    //   id : `product_uniq_id`,
    //   name : `My product name`,
    //   image : `/myproduct.png`,
    //   slug : `my-product`, // used to build url (`/products/my-product`)
    //   file : path.join(__dirname, `files`, `product.pdf`),
    //   price : 16.85,
    // },
  ]
};
