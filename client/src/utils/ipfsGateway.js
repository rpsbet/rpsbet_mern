// IPFS Gateway utilities with fallback support
// This utility helps avoid rate limiting by using multiple gateway providers

const IPFS_GATEWAYS = [
  'https://gateway.pinata.cloud/ipfs/',
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://dweb.link/ipfs/',
  'https://nftstorage.link/ipfs/',
  'https://w3s.link/ipfs/',
];

// Cache for failed gateways (resets every 5 minutes)
const failedGateways = new Set();
const GATEWAY_RETRY_DELAY = 5 * 60 * 1000; // 5 minutes

// Clear failed gateways periodically
setInterval(() => {
  failedGateways.clear();
}, GATEWAY_RETRY_DELAY);

/**
 * Extract IPFS hash from any IPFS URL
 * @param {string} url - IPFS URL from any gateway
 * @returns {string|null} - IPFS hash or null if not found
 */
export function extractIpfsHash(url) {
  if (!url) return null;
  
  // Match various IPFS URL patterns
  const patterns = [
    /\/ipfs\/([a-zA-Z0-9]+)/,
    /ipfs:\/\/([a-zA-Z0-9]+)/,
    /^(Qm[a-zA-Z0-9]+)$/,
    /^(baf[a-zA-Z0-9]+)$/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  
  return null;
}

/**
 * Get available IPFS gateways (excluding failed ones)
 * @returns {string[]} - Array of available gateway URLs
 */
export function getAvailableGateways() {
  return IPFS_GATEWAYS.filter(gateway => !failedGateways.has(gateway));
}

/**
 * Create IPFS URL with fallback gateways
 * @param {string} hashOrUrl - IPFS hash or existing IPFS URL
 * @param {number} gatewayIndex - Index of gateway to use (for fallbacks)
 * @returns {string|null} - IPFS URL or null if no hash found
 */
export function createIpfsUrl(hashOrUrl, gatewayIndex = 0) {
  const hash = extractIpfsHash(hashOrUrl);
  if (!hash) return null;
  
  const availableGateways = getAvailableGateways();
  if (availableGateways.length === 0) {
    // All gateways failed, reset and try again
    failedGateways.clear();
    return IPFS_GATEWAYS[0] + hash;
  }
  
  const gateway = availableGateways[gatewayIndex % availableGateways.length];
  return gateway + hash;
}

/**
 * Mark a gateway as failed
 * @param {string} url - Failed URL to extract gateway from
 */
export function markGatewayAsFailed(url) {
  const gateway = IPFS_GATEWAYS.find(gw => url.includes(gw));
  if (gateway) {
    failedGateways.add(gateway);
    console.warn(`Marked IPFS gateway as failed: ${gateway}`);
  }
}

/**
 * Load image with automatic gateway fallback
 * @param {string} ipfsUrl - IPFS URL to load
 * @returns {Promise<string>} - Promise that resolves to working URL
 */
export function loadImageWithFallback(ipfsUrl) {
  return new Promise((resolve, reject) => {
    const hash = extractIpfsHash(ipfsUrl);
    if (!hash) {
      reject(new Error('Invalid IPFS URL'));
      return;
    }
    
    let attemptIndex = 0;
    const availableGateways = getAvailableGateways();
    
    function tryNextGateway() {
      if (attemptIndex >= availableGateways.length) {
        reject(new Error('All IPFS gateways failed'));
        return;
      }
      
      const testUrl = createIpfsUrl(hash, attemptIndex);
      const img = new Image();
      
      img.onload = () => {
        resolve(testUrl);
      };
      
      img.onerror = () => {
        markGatewayAsFailed(testUrl);
        attemptIndex++;
        tryNextGateway();
      };
      
      // Add timeout to prevent hanging
      setTimeout(() => {
        if (img.complete) return;
        img.onload = null;
        img.onerror = null;
        markGatewayAsFailed(testUrl);
        attemptIndex++;
        tryNextGateway();
      }, 5000); // 5 second timeout
      
      img.src = testUrl;
    }
    
    tryNextGateway();
  });
}

/**
 * Create a React component that handles IPFS image loading with fallbacks
 * @param {string} src - IPFS URL
 * @param {string} fallbackSrc - Local fallback image
 * @param {object} props - Additional props for img element
 * @returns {JSX.Element} - Image element with fallback handling
 */
export function IpfsImage({ src, fallbackSrc, onLoad, onError, ...props }) {
  const [currentSrc, setCurrentSrc] = React.useState(src);
  const [attemptIndex, setAttemptIndex] = React.useState(0);
  
  React.useEffect(() => {
    if (src && extractIpfsHash(src)) {
      setCurrentSrc(createIpfsUrl(src, attemptIndex));
    }
  }, [src, attemptIndex]);
  
  const handleError = (e) => {
    if (currentSrc && extractIpfsHash(currentSrc)) {
      markGatewayAsFailed(currentSrc);
      const availableGateways = getAvailableGateways();
      
      if (attemptIndex < availableGateways.length - 1) {
        // Try next gateway
        setAttemptIndex(prev => prev + 1);
        return;
      }
    }
    
    // All gateways failed, use fallback
    setCurrentSrc(fallbackSrc);
    if (onError) onError(e);
  };
  
  return (
    <img
      {...props}
      src={currentSrc}
      onLoad={onLoad}
      onError={handleError}
    />
  );
}

export default {
  extractIpfsHash,
  getAvailableGateways,
  createIpfsUrl,
  markGatewayAsFailed,
  loadImageWithFallback,
  IpfsImage,
};