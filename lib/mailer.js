'use strict';

const nodemailer = require('nodemailer');

module.exports = config => {
  const transporter = nodemailer.createTransport(config.emails.transport);
  return {
    sendMail : (...args) => {
      return new Promise((resolve, reject) => {
        transporter.sendMail(...args, (error, info) => {
            if (error) {
                console.error(error);
                return reject(error);
            }
            return resolve(info);
        });
      });
    },
  };
};
