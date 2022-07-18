import axios from 'axios';

export default axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api', //YOUR_API_URL HERE
  // baseURL: process.env.NODE_ENV === 'production' ? '/api' : 'https://localhost:5001/api', //YOUR_API_URL HERE
  headers: {
    'Content-Type': 'application/json'
  },
  // withCredentials: true
});
