// index.js

const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/crypto_transactions', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('Connected to MongoDB'));



// Fetch transactions for a given address
async function fetchTransactions(address) {
    try {
      const response = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=3KKNSD9UGFTA6JM93GPT1EIEK6XIEEWD8X
      `);
      return response.data.result;
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  }
  
  // API endpoint to fetch transactions
  app.get('/api/transactions/:address', async (req, res) => {
    const address = req.params.address;
    try {
      const transactions = await fetchTransactions(address);
      // Save transactions to MongoDB
      await Transaction.insertMany(transactions);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  
  // Start the server
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });