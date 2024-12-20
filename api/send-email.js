const express = require('express');
const nodemailer = require('nodemailer');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const app = express();

// Middleware
app.use(express.json());

// Manually set CORS headers for all responses
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://js-form-data-capture.vercel.app");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  next();
});

// Connect to MongoDB
let db;
async function connectToDatabase() {
  try {
    await client.connect();
    db = client.db("emailstoragecluster");
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

// Define the /test endpoint
app.get('/api/test', (req, res) => {
  res.send('API is working!');
});

// Define the /send-email endpoint
app.options('/api/send-email', (req, res) => {
  res.sendStatus(200);
});

app.post('/api/send-email', async (req, res) => {
  const { name, email, contact, phone } = req.body;

  console.log('Received form data:', req.body);

  if (!db) {
    console.error("Database not connected");
    return res.status(500).send("Database connection failed");
  }

  const submission = { name, email, contact, phone, date: new Date() };
  try {
    const collection = db.collection('submissions');
    await collection.insertOne(submission);
    console.log('Form submission saved to MongoDB:', submission);
  } catch (error) {
    console.error('Error saving to MongoDB:', error);
    return res.status(500).send(`Error saving form submission: ${error.message}`);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER,
    subject: 'New Form Submission',
    text: `Name: ${name}\nEmail: ${email}\nContact Method: ${contact}${contact === 'phone' ? `\nPhone: ${phone}` : ''}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('Error occurred while sending email:', error);
      return res.status(500).send(`Error sending email: ${error.message}`);
    }
    console.log('Email sent:', info.response);
    res.status(200).send('Form submission successful');
  });
});

// Connect to the database and start the server
connectToDatabase().then(() => {
  const PORT = process.env.PORT || 9000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

module.exports = app;
