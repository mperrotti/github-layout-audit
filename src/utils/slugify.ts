import crypto from 'node:crypto';

/**
 * Convert a URL to a filesystem-safe filename
 */
export function slugify(url: string): string {
  try {
    const u = new URL(url);
    
    // Create a readable path component
    const safePath = (u.pathname || '/')
      .replace(/\/+/g, '_')
      .replace(/^_/, '')
      .replace(/_$/, '') || 'home';
    
    // Add query params if they exist
    const queryString = u.search ? `_${u.search.slice(1).replace(/[=&]/g, '_')}` : '';
    
    // Create a short hash for uniqueness
    const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 6);
    
    // Clean up the hostname
    const hostname = u.hostname.replace(/\./g, '_');
    
    return `${hostname}_${safePath}${queryString}_${hash}`;
  } catch (error) {
    // Fallback for invalid URLs
    const hash = crypto.createHash('md5').update(url).digest('hex').slice(0, 8);
    return `invalid_url_${hash}`;
  }
}