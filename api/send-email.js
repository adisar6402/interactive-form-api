const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

// MongoDB connection URI from environment variables
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const app = express();

// CORS configuration
app.use(cors({
  origin: 'https://js-form-data-capture.vercel.app',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

// Test endpoint to confirm server functionality
app.get('/test', (req, res) => {
  res.status(200).send("Test endpoint is working!");
});

let db;
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("emailstoragecluster");
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1); // Stop the process if unable to connect
  }
}

app.post('/send-email', async (req, res) => {
  const { name, email, contact, phone } = req.body;

  if (!db) {
    console.error("Database not connected");
    return res.status(500).send("Database connection failed");
  }

  // Save form submission to MongoDB
  const submission = { name, email, contact, phone, date: new Date() };
  try {
    const collection = db.collection('submissions');
    await collection.insertOne(submission);
    console.log('Form submission saved to MongoDB:', submission);
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    return res.status(500).send('Error saving form submission');
  }

  // Nodemailer transport setup
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Email details
  const mailOptions = {
    from: process.env.EMAIL_USER, // Ensure EMAIL_USER is set up correctly
    to: process.env.EMAIL_USER,
    subject: 'New Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nContact Method: ${contact}${contact === 'phone' ? `\nPhone: ${phone}` : ''}`,
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error occurred while sending email:', error);
      return res.status(500).send(`Error sending email: ${error.message}`);
    }
    console.log('Email sent:', info.response);
    res.status(200).send('Form submission successful');
  });
});

// Connect to the database on startup
connectToDatabase().then(() => {
  console.log(`Serverless function triggered for POST requests`);
});

module.exports = app;
