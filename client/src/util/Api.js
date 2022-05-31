import axios from 'axios';

export default axios.create({
  baseURL: `https://localhost:5001/api`, //YOUR_API_URL HERE
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});
