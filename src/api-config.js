export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000',
  API_KEY: process.env.REACT_APP_API_KEY || 'demo-key-12345',
  
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.REACT_APP_API_KEY || 'demo-key-12345'
  },
  
  TIMEOUT: {
    SEARCH: 5000,
    TREE: 30000,
    HEALTH: 2000
  },
  
  SEARCH: {
    MIN_CHARS: 2,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
    DEBOUNCE_MS: 300
  },
  
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 60,
    RETRY_AFTER: 60000
  }
};

export const apiRequest = async (endpoint, options = {}) => {
  // Get API key from environment variable (more secure)
  const apiKey = process.env.REACT_APP_API_KEY || API_CONFIG.API_KEY;
  
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey,
      ...options.headers
    }
  };
  
  const response = await fetch(url, config);
  
  if (response.status === 401) {
    throw new Error('Authentication failed. Check your API key.');
  } else if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please wait before retrying.');
  } else if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};