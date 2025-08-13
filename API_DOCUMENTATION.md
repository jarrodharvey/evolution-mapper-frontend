# Evolution Mapper API Documentation

## Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://your-domain.com` (when deployed)

## Authentication
All endpoints (except health check) require an API key.

**Methods:**
- **Header**: `X-API-Key: your-api-key`
- **Query Parameter**: `?api_key=your-api-key`

**Your API Token**: Store in `api-token.txt` (git-ignored)

## Endpoints

### 1. Health Check
**No authentication required**

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Evolution Mapper API is running",
  "timestamp": "2025-08-11 22:10:49"
}
```

---

### 2. Echo Test
**Test endpoint for echoing messages**

```http
GET /api/echo?msg={message}
```

**Parameters:**
- `msg` (optional): The message to echo back (default: "Hello World")

**Response:**
```json
{
  "echo": ["hello"],
  "timestamp": ["2025-08-12 21:58:56"]
}
```

---

### 2. Species Search
**Primary endpoint for species picker in frontend**

```http
GET /api/species?search={term}&limit={number}
```

**Parameters:**
- `search` (optional): Search term for species names (case-insensitive)
- `limit` (optional): Number of results (default 50, max 100)

**Examples:**
```bash
# Search for whales, limit to 7 results
GET /api/species?search=whale&limit=7

# Get first 10 species alphabetically
GET /api/species?limit=10

# Search for dogs
GET /api/species?search=dog
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "search_term": "whale",
  "limit_applied": 7,
  "species": [
    {
      "common": "Andrews beaked whale",
      "scientific": "Mesoplodon bowdoini", 
      "ott": 1021373
    },
    {
      "common": "Antarctic minke whale",
      "scientific": "Balaenoptera bonaerensis",
      "ott": 44568
    }
  ]
}
```

**Frontend Usage (React Select):**
```javascript
const loadSpecies = async (inputValue) => {
  const response = await fetch(
    `http://localhost:8000/api/species?search=${inputValue}&limit=10`,
    {
      headers: {
        'X-API-Key': 'your-api-key'
      }
    }
  );
  const data = await response.json();
  return data.species.map(s => ({ 
    value: s.common, 
    label: s.common,
    scientific: s.scientific 
  }));
};

<AsyncSelect
  loadOptions={loadSpecies}
  isMulti
  placeholder="Search for species..."
/>
```

---

### 3. Generate Phylogenetic Tree
**Main tree generation endpoint**

```http
POST /api/tree
Content-Type: application/json
```

**Body:**
```json
{
  "species": "Human,Dog,Cat,Whale"
}
```

**Response:**
```json
{
  "success": true,
  "html": "<html>...interactive CollapsibleTree HTML...</html>",
  "species_count": 4,
  "hierarchy_levels": 3
}
```

**Frontend Usage:**
```javascript
const generateTree = async (speciesList) => {
  const response = await fetch('http://localhost:8000/api/tree', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key'
    },
    body: JSON.stringify({ species: speciesList.join(',') })
  });
  
  const data = await response.json();
  if (data.success) {
    // Insert HTML into iframe or div
    document.getElementById('tree-container').innerHTML = data.html;
  }
};
```



---

## Error Responses

### Authentication Error (401)
```json
{
  "success": false,
  "error": "Invalid or missing API key. Include your API key in the 'X-API-Key' header or 'api_key' query parameter.",
  "documentation": "Contact the API administrator for access credentials."
}
```

### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "error": "Rate limit exceeded. Maximum 60 requests per minute allowed.",
  "retry_after": 60
}
```

### Validation Error (400)
```json
{
  "success": false,
  "error": "At least 2 species required for tree generation"
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Error generating tree: [specific error message]"
}
```

---

## Rate Limits
- **60 requests per minute per IP address**
- **HTTP 429** response when exceeded
- **Retry after 60 seconds**

---

## Tree Visualization Features

### Color Coding:
- **Red (#E74C3C)**: Root node ("Common ancestor - click me!")
- **Blue (#3498DB)**: Unnamed evolutionary ancestors
- **Orange (#F39C12)**: Named taxonomic groups (families, orders, etc.)
- **Green (#27AE60)**: Species (leaf nodes)

### Interactive Features:
- **Clickable nodes**: Expand/collapse tree branches
- **Zoomable**: Mouse wheel or touch gestures
- **Tooltips**: Hover for additional information
- **Responsive**: Adapts to container size (1200x800 default)

---

## Frontend Integration Tips

### 1. Species Picker Component
```javascript
// Use AsyncSelect for better UX with large species database
import AsyncSelect from 'react-select/async';

const SpeciesPicker = ({ onSelectionChange }) => {
  const loadOptions = async (inputValue) => {
    if (!inputValue || inputValue.length < 2) return [];
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/species?search=${inputValue}&limit=10`,
        { headers: { 'X-API-Key': API_KEY } }
      );
      const data = await response.json();
      
      return data.species.map(species => ({
        value: species.common,
        label: `${species.common} (${species.scientific})`,
        data: species
      }));
    } catch (error) {
      console.error('Error loading species:', error);
      return [];
    }
  };

  return (
    <AsyncSelect
      isMulti
      cacheOptions
      defaultOptions={false}
      loadOptions={loadOptions}
      onChange={onSelectionChange}
      placeholder="Search for species (e.g., whale, human, dog)..."
      noOptionsMessage={({ inputValue }) => 
        inputValue.length < 2 
          ? 'Type 2+ characters to search'
          : `No species found matching "${inputValue}"`
      }
    />
  );
};
```

### 2. Tree Display Component
```javascript
const TreeDisplay = ({ treeHTML }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (treeHTML && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow.document;
      
      doc.open();
      doc.write(treeHTML);
      doc.close();
      
      // Optional: Add custom styles
      const style = doc.createElement('style');
      style.textContent = `
        body { margin: 0; padding: 20px; }
        .tree-container { max-width: 100%; }
      `;
      doc.head.appendChild(style);
    }
  }, [treeHTML]);

  return (
    <iframe
      ref={iframeRef}
      width="100%"
      height="600px"
      frameBorder="0"
      title="Phylogenetic Tree"
    />
  );
};
```

### 3. Error Handling
```javascript
const handleApiError = (response) => {
  if (response.status === 401) {
    throw new Error('Invalid API key. Please check your configuration.');
  } else if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please wait a minute before trying again.');
  } else if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
};

// Usage in API calls
const apiCall = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'X-API-Key': API_KEY,
      ...options.headers
    }
  });
  
  handleApiError(response);
  return response.json();
};
```

---

## Development Setup

1. **Start the backend API:**
   ```bash
   cd /Users/jarrod/Developer/evolution-mapper-backend
   R -e "library(plumber); pr('plumber.R') %>% pr_run(port = 8000)"
   ```

2. **Get your API token:**
   ```bash
   cat api-token.txt
   ```

3. **Test connection:**
   ```bash
   curl -H "X-API-Key: $(cat api-token.txt)" "http://localhost:8000/api/species?search=whale&limit=5"
   ```

---

## Production Deployment Notes

- **Change API base URL** from localhost to production domain
- **Update API token** in production environment
- **Handle CORS** if frontend and API are on different domains
- **Implement retry logic** for rate limit handling
- **Add loading states** for better UX during API calls
- **Cache species data** when appropriate to reduce API calls