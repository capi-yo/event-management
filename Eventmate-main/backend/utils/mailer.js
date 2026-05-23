const nodemailer = require('nodemailer');

const port = parseInt(process.env.SMTP_PORT || '587', 10);
const secure = port === 465 || process.env.SMTP_SECURE === 'true';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.ethereal.email',
    port: port,
    secure: secure,
    auth: {
        user: process.env.SMTP_USER || 'ethereal.user@ethereal.email',
        pass: process.env.SMTP_PASS || 'ethereal.pass'
    }
});

module.exports = transporter;

