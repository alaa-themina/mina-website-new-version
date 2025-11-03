const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 8080;
const distPath = path.join(__dirname, 'dist');

// Redirect routes without trailing slash to with trailing slash (if directory exists)
app.use((req, res, next) => {
  if (req.path !== '/' && !req.path.endsWith('/') && !req.path.includes('.')) {
    const dirPath = path.join(distPath, req.path);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      return res.redirect(301, req.path + '/');
    }
  }
  next();
});

// Serve static files from the dist directory
app.use(express.static(distPath, {
  index: false, // Don't auto-serve index.html, we'll handle it manually
  redirect: false
}));

// Handle routes that end with / - check for index.html in that directory
app.get('*', (req, res) => {
  const requestPath = req.path;
  
  // If request ends with /, check for index.html in that directory
  if (requestPath.endsWith('/')) {
    const indexPath = path.join(distPath, requestPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // Check if the path without trailing slash exists as directory with index.html
  const cleanPath = requestPath === '/' ? '/' : requestPath.replace(/\/$/, '');
  const potentialIndexPath = path.join(distPath, cleanPath, 'index.html');
  if (fs.existsSync(potentialIndexPath)) {
    return res.sendFile(potentialIndexPath);
  }
  
  // Fallback to root index.html for SPA routing
  const rootIndex = path.join(distPath, 'index.html');
  if (fs.existsSync(rootIndex)) {
    return res.sendFile(rootIndex);
  }
  
  // 404
  res.status(404).send('Not found');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

