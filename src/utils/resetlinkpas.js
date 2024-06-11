const nodemailer=require('nodemailer')
const sendPasswordResetEmail = async (email, resetLink) => {
    console.log(email)
    try {
      // Create a transporter and configure it with your email service provider's details
      const transporter = nodemailer.createTransport({
        host: process.env.MAILHOST,
        port: process.env.MAILPORT,
        secure: false,
        auth: {
          user: process.env.MAIL,
          pass: process.env.MAILPASS,
        },
      });
      console.log(transporter)
      const mailOptions = {
        from: process.env.MAIL,
        to: email,
        subject: "Password Reset",
        html: `<p>Click <a href="${resetLink}">here</a> to reset your password.</p>`,
      };
      console.log(mailOptions)
      const result = await transporter.sendMail(mailOptions);
      console.log(result)
      return result.accepted.length > 0;
    } catch (error) {
      return false;
    }
  };
  module.exports = sendPasswordResetEmail;