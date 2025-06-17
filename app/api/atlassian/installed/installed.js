// api/atlassian-connect/installed.js (for Vercel serverless functions)
import jwt from 'jsonwebtoken';

// Store installation data (in production, use a database)
const installations = new Map();

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify JWT token from Jira
    const token = req.body;
    const decoded = jwt.decode(token, { complete: true });
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid JWT token' });
    }

    // Store installation data
    const installation = {
      clientKey: decoded.payload.iss,
      sharedSecret: req.body.sharedSecret || generateSharedSecret(),
      baseUrl: decoded.payload.aud[0]
    };
    
    installations.set(installation.clientKey, installation);
    
    console.log('App installed for:', installation.clientKey);
    res.status(200).json({ message: 'Installation successful' });
    
  } catch (error) {
    console.error('Installation error:', error);
    res.status(500).json({ error: 'Installation failed' });
  }
}

function generateSharedSecret() {
  return require('crypto').randomBytes(32).toString('hex');
}

// api/atlassian-connect/uninstalled.js
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = req.body;
    const decoded = jwt.decode(token, { complete: true });
    
    if (decoded && decoded.payload.iss) {
      installations.delete(decoded.payload.iss);
      console.log('App uninstalled for:', decoded.payload.iss);
    }
    
    res.status(200).json({ message: 'Uninstallation successful' });
  } catch (error) {
    console.error('Uninstallation error:', error);
    res.status(500).json({ error: 'Uninstallation failed' });
  }
}

// middleware/jwtAuth.js - JWT verification middleware
import jwt from 'jsonwebtoken';

export function verifyJWT(req, res, next) {
  const token = req.query.jwt || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No JWT token provided' });
  }

  try {
    const decoded = jwt.decode(token, { complete: true });
    const installation = installations.get(decoded.payload.iss);
    
    if (!installation) {
      return res.status(401).json({ error: 'Installation not found' });
    }

    // Verify JWT signature
    const verified = jwt.verify(token, installation.sharedSecret);
    req.jira = {
      installation,
      user: verified,
      context: decoded.payload
    };
    
    next();
  } catch (error) {
    console.error('JWT verification failed:', error);
    res.status(401).json({ error: 'Invalid JWT token' });
  }
}
