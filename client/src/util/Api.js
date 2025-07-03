import axios from 'axios';

export default axios.create({
  baseURL:
    process.env.NODE_ENV === 'production'
      ? '/api'
      : `http://${window.location.hostname}:5001/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});
