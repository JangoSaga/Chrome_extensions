/* eslint-disable no-undef */
// Domain utilities for SiteSort Pro Chrome Extension

/**
 * Extract domain from URL
 * @param {string} url - The URL to extract domain from
 * @returns {string|null} - The extracted domain or null if invalid
 */
export function extractDomain(url) {
  try {
    if (!url || typeof url !== 'string') {
      return null;
    }

    // Handle different URL formats
    let cleanUrl = url.trim();

    // Add protocol if missing
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const urlObj = new URL(cleanUrl);
    let hostname = urlObj.hostname.toLowerCase();

    // Remove 'www.' prefix
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }

    // Remove common subdomain prefixes
    const subdomainsToRemove = ['m.', 'mobile.', 'app.', 'api.', 'cdn.'];
    for (const subdomain of subdomainsToRemove) {
      if (hostname.startsWith(subdomain)) {
        hostname = hostname.substring(subdomain.length);
        break;
      }
    }

    return hostname;
  } catch (error) {
    console.error('Error extracting domain from URL:', url, error);
    return null;
  }
}

/**
 * Get root domain from a domain (removes all subdomains except common ones)
 * @param {string} domain - The domain to process
 * @returns {string} - The root domain
 */
function getRootDomain(domain) {
  if (!domain) return '';

  const parts = domain.split('.');

  // Handle special cases for known TLDs
  const knownTLDs = [
    'co.uk',
    'co.in',
    'co.jp',
    'co.kr',
    'com.au',
    'com.br',
    'com.mx',
    'gov.uk',
    'gov.au',
    'edu.au',
    'ac.uk',
    'org.uk',
    'net.uk',
  ];

  // Check if domain ends with known multi-part TLD
  for (const tld of knownTLDs) {
    if (domain.endsWith('.' + tld)) {
      const beforeTLD = domain.substring(0, domain.length - tld.length - 1);
      const beforeParts = beforeTLD.split('.');
      if (beforeParts.length >= 1) {
        return beforeParts[beforeParts.length - 1] + '.' + tld;
      }
    }
  }

  // Standard case: return last two parts (domain.tld)
  if (parts.length >= 2) {
    return parts.slice(-2).join('.');
  }

  return domain;
}

/**
 * Check if a URL is valid
 * @param {string} url - The URL to validate
 * @returns {boolean} - Whether the URL is valid
 */
function isValidUrl(url) {
  try {
    if (!url || typeof url !== 'string') {
      return false;
    }

    // Add protocol if missing for validation
    let testUrl = url.trim();
    if (!testUrl.startsWith('http://') && !testUrl.startsWith('https://')) {
      testUrl = 'https://' + testUrl;
    }

    const urlObj = new URL(testUrl);
    return urlObj.hostname.length > 0 && urlObj.hostname.includes('.');
  } catch (error) {
    console.log(error);
    return false;
  }
}

/**
 * Check if a domain is valid
 * @param {string} domain - The domain to validate
 * @returns {boolean} - Whether the domain is valid
 */
function isValidDomain(domain) {
  if (!domain || typeof domain !== 'string') {
    return false;
  }

  // Basic domain validation regex
  const domainRegex =
    /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  return domainRegex.test(domain.trim().toLowerCase()) && domain.includes('.');
}

/**
 * Normalize domain (clean and standardize)
 * @param {string} domain - The domain to normalize
 * @returns {string} - The normalized domain
 */
function normalizeDomain(domain) {
  if (!domain) return '';

  let normalized = domain.trim().toLowerCase();

  // Remove protocol if present
  normalized = normalized.replace(/^https?:\/\//, '');

  // Remove www prefix
  if (normalized.startsWith('www.')) {
    normalized = normalized.substring(4);
  }

  // Remove trailing slash and path
  normalized = normalized.split('/')[0];

  // Remove port number
  normalized = normalized.split(':')[0];

  return normalized;
}

/**
 * Get domain display name (prettier format for UI)
 * @param {string} domain - The domain to format
 * @returns {string} - The formatted display name
 */
function getDomainDisplayName(domain) {
  if (!domain) return '';

  const normalized = normalizeDomain(domain);

  // Capitalize first letter of each part
  return normalized
    .split('.')
    .map((part) => {
      if (part.length === 0) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join('.');
}

/**
 * Check if URL is a system/internal URL that should be ignored
 * @param {string} url - The URL to check
 * @returns {boolean} - Whether the URL is a system URL
 */
function isSystemUrl(url) {
  if (!url) return true;

  const systemPrefixes = [
    'chrome://',
    'chrome-extension://',
    'moz-extension://',
    'edge://',
    'about:',
    'file://',
    'data:',
    'javascript:',
    'blob:',
    'chrome-search://',
    'chrome-devtools://',
  ];

  return systemPrefixes.some((prefix) => url.startsWith(prefix));
}

/**
 * Get favicon URL for a domain
 * @param {string} domain - The domain to get favicon for
 * @returns {string} - The favicon URL
 */
function getFaviconUrl(domain) {
  if (!domain) return '';

  const normalizedDomain = normalizeDomain(domain);

  // Use Google's favicon service as fallback
  return `https://www.google.com/s2/favicons?domain=${normalizedDomain}&sz=32`;
}

/**
 * Check if two domains are the same (accounting for subdomains)
 * @param {string} domain1 - First domain
 * @param {string} domain2 - Second domain
 * @returns {boolean} - Whether domains are the same
 */
function domainsMatch(domain1, domain2) {
  if (!domain1 || !domain2) return false;

  const normalized1 = normalizeDomain(domain1);
  const normalized2 = normalizeDomain(domain2);

  return (
    normalized1 === normalized2 ||
    getRootDomain(normalized1) === getRootDomain(normalized2)
  );
}

/**
 * Extract all domains from a list of URLs
 * @param {string[]} urls - Array of URLs
 * @returns {string[]} - Array of unique domains
 */
function extractDomainsFromUrls(urls) {
  if (!Array.isArray(urls)) return [];

  const domains = new Set();

  urls.forEach((url) => {
    const domain = extractDomain(url);
    if (domain && !isSystemUrl(url)) {
      domains.add(domain);
    }
  });

  return Array.from(domains).sort();
}

/**
 * Get domain category suggestions based on domain name
 * @param {string} domain - The domain to analyze
 * @returns {string[]} - Array of suggested categories
 */
function getDomainCategorySuggestions(domain) {
  if (!domain) return [];

  const normalizedDomain = normalizeDomain(domain).toLowerCase();
  const suggestions = [];

  // Common domain patterns and their categories
  const patterns = [
    // Social Media
    {
      keywords: [
        'facebook',
        'twitter',
        'instagram',
        'linkedin',
        'tiktok',
        'snapchat',
        'pinterest',
        'reddit',
        'discord',
        'telegram',
        'whatsapp',
      ],
      category: 'Social Media',
    },

    // Entertainment
    {
      keywords: [
        'youtube',
        'netflix',
        'hulu',
        'disney',
        'spotify',
        'twitch',
        'gaming',
        'music',
        'video',
        'movie',
        'tv',
        'entertainment',
      ],
      category: 'Entertainment',
    },

    // Education
    {
      keywords: [
        'edu',
        'coursera',
        'udemy',
        'khan',
        'duolingo',
        'university',
        'college',
        'school',
        'learn',
        'course',
        'tutorial',
        'education',
      ],
      category: 'Education',
    },

    // News
    {
      keywords: [
        'news',
        'cnn',
        'bbc',
        'reuters',
        'times',
        'post',
        'herald',
        'journal',
        'magazine',
        'blog',
      ],
      category: 'News',
    },

    // Shopping
    {
      keywords: [
        'amazon',
        'ebay',
        'shop',
        'store',
        'buy',
        'sell',
        'market',
        'commerce',
        'retail',
        'mall',
      ],
      category: 'Shopping',
    },

    // Technology
    {
      keywords: [
        'github',
        'stack',
        'tech',
        'dev',
        'code',
        'programming',
        'software',
        'computer',
        'digital',
        'tech',
      ],
      category: 'Technology',
    },

    // Finance
    {
      keywords: [
        'bank',
        'finance',
        'money',
        'invest',
        'trading',
        'crypto',
        'bitcoin',
        'stock',
        'financial',
      ],
      category: 'Finance',
    },

    // Health
    {
      keywords: [
        'health',
        'medical',
        'doctor',
        'hospital',
        'medicine',
        'fitness',
        'wellness',
        'diet',
      ],
      category: 'Health',
    },

    // Travel
    {
      keywords: [
        'travel',
        'hotel',
        'booking',
        'flight',
        'trip',
        'vacation',
        'tourism',
        'airline',
      ],
      category: 'Travel',
    },

    // Work/Business
    {
      keywords: [
        'work',
        'business',
        'corporate',
        'company',
        'office',
        'professional',
        'enterprise',
        'corp',
      ],
      category: 'Work',
    },
  ];

  // Check domain against patterns
  for (const pattern of patterns) {
    for (const keyword of pattern.keywords) {
      if (normalizedDomain.includes(keyword)) {
        if (!suggestions.includes(pattern.category)) {
          suggestions.push(pattern.category);
        }
        break;
      }
    }
  }

  // If no specific matches, suggest based on TLD
  if (suggestions.length === 0) {
    if (
      normalizedDomain.endsWith('.edu') ||
      normalizedDomain.endsWith('.ac.uk')
    ) {
      suggestions.push('Education');
    } else if (
      normalizedDomain.endsWith('.gov') ||
      normalizedDomain.endsWith('.gov.uk')
    ) {
      suggestions.push('Government');
    } else if (normalizedDomain.endsWith('.org')) {
      suggestions.push('Organization');
    }
  }

  return suggestions;
}

/**
 * Parse URL and extract useful information
 * @param {string} url - The URL to parse
 * @returns {object} - Object containing parsed URL information
 */
function parseUrl(url) {
  try {
    if (!url) return null;

    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const urlObj = new URL(cleanUrl);

    return {
      full: url,
      protocol: urlObj.protocol,
      hostname: urlObj.hostname,
      domain: extractDomain(url),
      rootDomain: getRootDomain(extractDomain(url)),
      pathname: urlObj.pathname,
      search: urlObj.search,
      hash: urlObj.hash,
      port: urlObj.port,
      isSecure: urlObj.protocol === 'https:',
      isSystem: isSystemUrl(url),
    };
  } catch (error) {
    console.error('Error parsing URL:', url, error);
    return null;
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = {
    extractDomain,
    getRootDomain,
    isValidUrl,
    isValidDomain,
    normalizeDomain,
    getDomainDisplayName,
    isSystemUrl,
    getFaviconUrl,
    domainsMatch,
    extractDomainsFromUrls,
    getDomainCategorySuggestions,
    parseUrl,
  };
}
