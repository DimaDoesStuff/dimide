const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 8080;
const EXTENSIONS_DIR = path.join(__dirname, 'extensions');
const CACHE_DIR = path.join(__dirname, 'cache');

// Ensure directories exist
fs.ensureDirSync(EXTENSIONS_DIR);
fs.ensureDirSync(CACHE_DIR);

app.use(cors());
app.use(express.json());

// Load extension metadata
function loadExtensionMetadata() {
  const metadataPath = path.join(__dirname, 'extensions.json');
  if (fs.existsSync(metadataPath)) {
    return fs.readJsonSync(metadataPath);
  }
  return { extensions: [] };
}

// Save extension metadata
function saveExtensionMetadata(metadata) {
  const metadataPath = path.join(__dirname, 'extensions.json');
  fs.writeJsonSync(metadataPath, metadata, { spaces: 2 });
}

// VS Code Marketplace API - Query extensions
app.get('/api/extensions', async (req, res) => {
  try {
    const { searchText, pageSize = 50 } = req.query;
    const metadata = loadExtensionMetadata();
    
    let extensions = metadata.extensions;
    
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      extensions = extensions.filter(ext => 
        (ext.displayName?.toLowerCase().includes(searchLower) ||
         ext.extensionName?.toLowerCase().includes(searchLower) ||
         ext.shortDescription?.toLowerCase().includes(searchLower) ||
         ext.publisher?.publisherName?.toLowerCase().includes(searchLower))
      );
    }
    
    res.json({
      results: extensions.slice(0, parseInt(pageSize)),
      resultCount: extensions.length
    });
  } catch (error) {
    console.error('Error querying extensions:', error);
    res.status(500).json({ error: 'Failed to query extensions' });
  }
});

// Get specific extension details
app.get('/api/extensions/:publisher/:name', async (req, res) => {
  try {
    const { publisher, name } = req.params;
    const metadata = loadExtensionMetadata();
    
    const extension = metadata.extensions.find(ext => 
      ext.publisher?.publisherName === publisher && 
      ext.extensionName === name
    );
    
    if (!extension) {
      return res.status(404).json({ error: 'Extension not found' });
    }
    
    res.json(extension);
  } catch (error) {
    console.error('Error getting extension:', error);
    res.status(500).json({ error: 'Failed to get extension' });
  }
});

// Download extension .vsix file
app.get('/api/download/:publisher/:name/:version', async (req, res) => {
  try {
    const { publisher, name, version } = req.params;
    const vsixFilename = `${publisher}.${name}-${version}.vsix`;
    const localPath = path.join(EXTENSIONS_DIR, vsixFilename);
    
    // Check if we have it locally first
    if (fs.existsSync(localPath)) {
      return res.download(localPath);
    }
    
    // Try to fetch from Open VSX as fallback
    try {
      const openVsxUrl = `https://open-vsx.org/api/${publisher}/${name}/${version}/file/${publisher}.${name}-${version}.vsix`;
      const response = await axios.get(openVsxUrl, { responseType: 'stream' });
      
      res.setHeader('Content-Disposition', `attachment; filename="${vsixFilename}"`);
      res.setHeader('Content-Type', 'application/octet-stream');
      response.data.pipe(res);
      return;
    } catch (fallbackError) {
      console.log('Fallback to Open VSX failed:', fallbackError.message);
    }
    
    res.status(404).json({ error: 'Extension file not found' });
  } catch (error) {
    console.error('Error downloading extension:', error);
    res.status(500).json({ error: 'Failed to download extension' });
  }
});

// List all available extensions
app.get('/api/list', (req, res) => {
  try {
    const metadata = loadExtensionMetadata();
    res.json({
      count: metadata.extensions.length,
      extensions: metadata.extensions.map(ext => ({
        id: `${ext.publisher?.publisherName}.${ext.extensionName}`,
        name: ext.displayName || ext.extensionName,
        publisher: ext.publisher?.publisherName,
        version: ext.versions?.[0]?.version,
        description: ext.shortDescription
      }))
    });
  } catch (error) {
    console.error('Error listing extensions:', error);
    res.status(500).json({ error: 'Failed to list extensions' });
  }
});

// Simple web interface
app.get('/', (req, res) => {
  const metadata = loadExtensionMetadata();
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>DimIDE Extension Marketplace</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; background: #1e1e1e; color: #d4d4d4; }
    h1 { color: #0078d4; }
    .extension-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; margin-top: 30px; }
    .extension-card { background: #252526; border: 1px solid #3e3e42; border-radius: 6px; padding: 15px; }
    .extension-card h3 { margin: 0 0 10px 0; color: #4fc1ff; }
    .extension-card p { margin: 5px 0; font-size: 14px; color: #cccccc; }
    .extension-card .publisher { color: #9cdcfe; font-size: 12px; }
    .extension-card .version { color: #b5cea8; font-size: 12px; }
    .search-box { width: 100%; max-width: 500px; padding: 10px 15px; font-size: 16px; background: #3c3c3c; border: 1px solid #3e3e42; color: #d4d4d4; border-radius: 4px; }
    .stats { margin: 20px 0; padding: 15px; background: #252526; border-radius: 6px; }
    a { color: #4fc1ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <h1>DimIDE Extension Marketplace</h1>
  <div class="stats">
    <strong>${metadata.extensions.length}</strong> extensions available<br>
    <small>Server running on port ${PORT}</small><br>
    <small>API Endpoint: <code>/api/extensions</code></small>
  </div>
  
  <input type="text" class="search-box" id="search" placeholder="Search extensions...">
  
  <div class="extension-grid" id="extensions">
    ${metadata.extensions.map(ext => `
      <div class="extension-card" data-name="${(ext.displayName || ext.extensionName || '').toLowerCase()}">
        <h3>${ext.displayName || ext.extensionName}</h3>
        <p class="publisher">${ext.publisher?.displayName || ext.publisher?.publisherName || 'Unknown'}</p>
        <p>${ext.shortDescription || 'No description'}</p>
        <p class="version">v${ext.versions?.[0]?.version || '?.?.?'}</p>
        <p><a href="/api/download/${ext.publisher?.publisherName}/${ext.extensionName}/${ext.versions?.[0]?.version}">Download</a></p>
      </div>
    `).join('')}
  </div>
  
  <script>
    document.getElementById('search').addEventListener('input', (e) => {
      const search = e.target.value.toLowerCase();
      document.querySelectorAll('.extension-card').forEach(card => {
        const name = card.getAttribute('data-name');
        card.style.display = name.includes(search) ? '' : 'none';
      });
    });
  </script>
</body>
</html>
  `;
  res.send(html);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║     DimIDE Extension Marketplace Server                ║
╠════════════════════════════════════════════════════════╣
║  Port: ${PORT}                                          ║
║  Extensions: ${loadExtensionMetadata().extensions.length}                                  ║
║                                                        ║
║  Web Interface: http://localhost:${PORT}                 ║
║  API: http://localhost:${PORT}/api/extensions            ║
╚════════════════════════════════════════════════════════╝
  `);
});
