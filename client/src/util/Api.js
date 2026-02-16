import axios from 'axios';
import { createMockApi } from '../mock/mockApi';

const useMock = process.env.REACT_APP_USE_MOCK === 'true';

const api = useMock
  ? createMockApi()
  : axios.create({
      baseURL:
        process.env.NODE_ENV === 'production'
          ? '/api'
          : `http://${window.location.hostname}:5001/api`,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

export default api;
