// Evolution Mapper API Configuration Template
// Copy this file to api-config.js and update with your settings

export const API_CONFIG = {
  // API Base URL
  BASE_URL: 'http://localhost:8000',  // Development
  // BASE_URL: 'https://your-domain.com',  // Production
  
  // API Key (store securely, never commit to version control)
  API_KEY: 'your-api-key-here',  // Replace with actual key
  
  // Default request options
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'X-API-Key': 'your-api-key-here'  // Replace with actual key
  },
  
  // Request timeouts (milliseconds)
  TIMEOUT: {
    SEARCH: 5000,      // Species search requests
    TREE: 30000,       // Tree generation (can take time)
    HEALTH: 2000       // Health check
  },
  
  // Species search configuration
  SEARCH: {
    MIN_CHARS: 2,      // Minimum characters before searching
    DEFAULT_LIMIT: 10, // Default number of search results
    MAX_LIMIT: 50,     // Maximum search results
    DEBOUNCE_MS: 300   // Debounce delay for search input
  },
  
  // Rate limiting awareness
  RATE_LIMITS: {
    REQUESTS_PER_MINUTE: 60,
    RETRY_AFTER: 60000  // Retry after rate limit (milliseconds)
  }
};

// Helper function to get API key from file (development only)
export const loadApiKeyFromFile = async () => {
  try {
    const response = await fetch('./api-token.txt');
    const apiKey = await response.text();
    return apiKey.trim();
  } catch (error) {
    console.warn('Could not load API key from file:', error);
    return null;
  }
};

// Create configured fetch function
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  const config = {
    ...options,
    headers: {
      ...API_CONFIG.DEFAULT_HEADERS,
      ...options.headers
    }
  };
  
  const response = await fetch(url, config);
  
  // Handle common API errors
  if (response.status === 401) {
    throw new Error('Authentication failed. Check your API key.');
  } else if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please wait before retrying.');
  } else if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};