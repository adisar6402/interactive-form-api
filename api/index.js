const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Load environment variables

// Confirm Environment Variables Load Correctly
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS);
console.log('PORT:', process.env.PORT);

const app = express();
const PORT = process.env.PORT || 9000; // Change the default port to 9000

// Middleware to parse JSON bodies
app.use(express.json());

// Root route
app.get('/', (req, res) => {
    res.send('Welcome to the email server!'); // A simple response for the root route
});

// Route to handle form submissions
app.post('/send-email', (req, res) => {
    const { name, email, contact, phone } = req.body;

    // Set up your email service here using nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Your email from .env
            pass: process.env.EMAIL_PASS, // Your email password from .env
        },
    });

    const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER, // Your email to receive submissions
        subject: 'New Form Submission',
        text: `Name: ${name}\nEmail: ${email}\nContact Method: ${contact}${contact === 'phone' ? `\nPhone: ${phone}` : ''}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error occurred:', error);
            return res.status(500).send('Error sending email');
        }
        console.log('Email sent:', info.response);
        res.status(200).send('Form submission successful');
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
