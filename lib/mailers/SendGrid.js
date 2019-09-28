const sgMail = require('@sendgrid/mail');

module.exports = config => {
    sgMail.setApiKey(config.emails.apiKey);
    const logger = require('../logger')(config);

    if (!config.emails.apiKey) {
        logger.log('Using SendGrid Mailer but no apiKey provided ! Using default Dev mailer...');
        return require('./Dev')(config);
    }

    return {
        sendMail: sgMail.send.bind(sgMail),
    };
}

