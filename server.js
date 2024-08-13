const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();
const mongoURI = process.env.MONGO_URI;

let db;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
MongoClient.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(client => {
  console.log('MongoDB connected');
  db = client.db('test'); // actual database name
}).catch(err => console.log(err));

// API route to save or update user data
app.post('/api/saveUserData', async (req, res) => {
    const { name, status, officeNumber, quote } = req.body;
  
    try {
        const collection = db.collection('userdatas'); 
        const existingUser = await collection.findOne({ name });
        
        if (existingUser) {
            // If user exists, update their data
            await collection.updateOne(
                { _id: existingUser._id },
                { $set: { status, officeNumber, quote } }
            );
            res.status(200).json({ message: 'User data updated successfully!' });
        } else {
            // If user does not exist, create a new one
            const result = await collection.insertOne({ name, status, officeNumber, quote });
            res.status(201).json({ message: 'Data saved successfully!', id: result.insertedId });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error saving data', error: error.toString() });
    }
});

//API route to return user info for card creation
// API route to get user data by name or another unique identifier
app.get('/api/getUserData/:name', async (req, res) => {
    const { name } = req.params;

    try {
        const collection = db.collection('userdatas');
        const user = await collection.findOne({ name });

        if (user) {
            // Provide default values if fields are missing
            const responseData = {
                name: user.name || name,
                status: user.status || 'No status set',
                officeNumber: user.officeNumber || 'No office number set',
                quote: user.quote || 'No quote set'
            };
            res.status(200).json(responseData);
        } else {
            // If user is not found, send default data
            res.status(200).json({
                name: name,
                status: 'No status set',
                officeNumber: 'No office number set',
                quote: 'No quote set'
            });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching data', error: error.toString() });
    }
});

// API route to get all users
app.get('/api/getAllUsers', async (req, res) => {
    try {
      const collection = db.collection('userdatas');
      const users = await collection.find({}).toArray();
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ message: 'Error fetching users', error: error.toString() });
    }
  });

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});