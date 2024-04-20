// index.js

const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const Transaction = require('./models/Transaction');
const EthereumPrice = require('./models/EthereumPrice');


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

// Define the fetchEthereumPrice function
async function fetchEthereumPrice() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr');
    return response.data.ethereum.inr;
  } catch (error) {
    console.error('Error fetching Ethereum price:', error);
    return null;
  }
}

// Fetch transactions for a given address
async function fetchTransactions(address) {
    try {
      const response = await axios.get(`https://api.etherscan.io/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc&apikey=3KKNSD9UGFTA6JM93GPT1EIEK6XIEEWD8X`);
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

// Fetch Ethereum price every 10 minutes and store it in the database
async function fetchAndStoreEthereumPrice() {
    try {
      const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr');
      const ethereumPrice = response.data.ethereum.inr;
      await EthereumPrice.create({ price: ethereumPrice });
      console.log('Ethereum price fetched and stored:', ethereumPrice);
    } catch (error) {
      console.error('Error fetching Ethereum price:', error);
    }
  }
  
  // Fetch Ethereum price initially and then every 10 minutes
  fetchAndStoreEthereumPrice();
  setInterval(fetchAndStoreEthereumPrice, 10 * 60 * 1000); // Fetch every 10 minutes
  
  // Calculate user's balance function
async function getUserBalance(address) {
    try {
      const transactions = await Transaction.find({ $or: [{ from: address }, { to: address }] });
      let balance = 0;
      transactions.forEach(transaction => {
        if (transaction.to.toLowerCase() === address.toLowerCase()) {
          balance += parseInt(transaction.value);
        } else if (transaction.from.toLowerCase() === address.toLowerCase()) {
          balance -= parseInt(transaction.value);
        }
      });
      return balance;
    } catch (error) {
      console.error('Error calculating user balance:', error);
      return null;
    }
  }
  
  // API endpoint to get user's balance and current Ethereum price
  app.get('/api/user/:address', async (req, res) => {
    const address = req.params.address;
    try {
      const [balance, ethereumPrice] = await Promise.all([getUserBalance(address), fetchEthereumPrice()]);
      if (balance === null || ethereumPrice === null) {
        return res.status(500).json({ error: 'Internal Server Error' });
      }
      res.json({ balance, ethereumPrice });
    } catch (error) {
      console.error('Error fetching user balance and Ethereum price:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });
  

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
