const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'batam.cg@gmail.com',
    pass: 'eoyk bafg cxvv egmy'
  }
});

const sendMail = async (to, subject, html) => {
  if (!to) return;
  const mailOptions = {
    from: '"System Notification Plant Batam - CHES" <batam.cg@gmail.com>',
    to,
    subject,
    html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
};

module.exports = {
  sendMail
};
