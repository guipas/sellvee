'use strict';

const util = require('util');
const nodemailer = require('nodemailer');
const config = require('../config');

// Generate test SMTP service account from ethereal.email
// Only needed if you don't have a real mail account for testing
let sendMail = () => {
  console.log('no email sent');
  return Promise.resolve()
};

let transporter = null;

nodemailer.createTestAccount((err, account) => {//eslint-disable-line
    // create reusable transporter object using the default SMTP transport
    transporter = nodemailer.createTransport(config.transport);

    // setup email data with unicode symbols
    // let mailOptions = {
    //     from: '"Fred Foo 👻" <foo@example.com>', // sender address
    //     to: 'bar@example.com, baz@example.com', // list of receivers
    //     subject: 'Hello ✔', // Subject line
    //     text: 'Hello world?', // plain text body
    //     html: '<b>Hello world?</b>' // html body
    // };

    // send mail with defined transport object
    // sendMail = util.promisify(transporter.sendMail);

    // transporter.sendMail(mailOptions, (error, info) => {
    //     if (error) {
    //         return console.log(error);
    //     }
    //     console.log('Message sent: %s', info.messageId);
    //     // Preview only available when sending through an Ethereal account
    //     console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

    //     // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    //     // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    // });
});

module.exports = {
  sendMail : (...args) => {
    if (!transporter) {
      console.log(`not sending email`);
      return Promise.resolve();
    }

    console.log(`sending email...`, args);
    return new Promise((resolve, reject) => {
      transporter.sendMail(...args, (error, info) => {
          if (error) {
              console.log(error);
              return reject(error);
          }
          console.log('Message sent: %s', info.messageId);
          // Preview only available when sending through an Ethereal account
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
          return resolve(info);
          // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
          // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      });

    });
  },
};
