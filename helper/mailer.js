import { createTransport } from 'nodemailer';

const mailer = createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAILER_USER,
    pass: process.env.MAILER_PASSWORD
  }
});

export const sendEmail = (to, subject, html) =>
  mailer.sendMail({
    from: 'support@rpsbet.io',
    to,
    subject,
    html
  });

export const resetPassword = (email, name, changePasswordId) => {
  const template = fs.read;
  return sendEmail({ name, address: email }, 'Reset Password', ``);
};
