// utils/safeStateComparison.js

/**
 * Safely compares two objects without circular references
 * @param {*} prev - Previous value
 * @param {*} next - Next value
 * @returns {boolean} - Whether the values are equal
 */
export const safeDeepEqual = (prev, next) => {
  // Handle primitive types
  if (prev === next) return true;
  
  // Handle null/undefined
  if (prev == null || next == null) return prev === next;
  
  // Handle different types
  if (typeof prev !== typeof next) return false;
  
  // Handle arrays
  if (Array.isArray(prev) && Array.isArray(next)) {
    if (prev.length !== next.length) return false;
    return prev.every((item, index) => safeDeepEqual(item, next[index]));
  }
  
  // Handle objects
  if (typeof prev === 'object' && typeof next === 'object') {
    const prevKeys = Object.keys(prev);
    const nextKeys = Object.keys(next);
    
    if (prevKeys.length !== nextKeys.length) return false;
    
    return prevKeys.every(key => {
      // Skip circular reference prone objects
      if (isCircularReference(prev[key])) {
        return prev[key] === next[key]; // Use reference equality for circular objects
      }
      return safeDeepEqual(prev[key], next[key]);
    });
  }
  
  return false;
};

/**
 * Checks if an object might contain circular references
 * @param {*} obj - Object to check
 * @returns {boolean} - Whether object might be circular
 */
const isCircularReference = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  
  // Common circular reference patterns
  const circularPatterns = [
    'socket', 'io', 'manager', 'nsps', '_socket',
    'engine', 'transport', 'ws', 'xhr'
  ];
  
  const objString = Object.prototype.toString.call(obj);
  const constructor = obj.constructor?.name;
  
  // Check for known circular objects
  if (constructor && ['Socket', 'Manager', 'Engine'].includes(constructor)) {
    return true;
  }
  
  // Check for circular properties
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    return keys.some(key => circularPatterns.includes(key.toLowerCase()));
  }
  
  return false;
};

/**
 * Creates a safe selector for Redux that handles circular references
 * @param {Function} selector - Redux selector function
 * @param {Function} equalityFn - Optional custom equality function
 * @returns {Function} - Safe selector
 */
export const createSafeSelector = (selector, equalityFn = safeDeepEqual) => {
  return (state) => {
    try {
      const result = selector(state);
      
      // Filter out circular reference objects
      if (typeof result === 'object' && result !== null) {
        const filteredResult = {};
        Object.keys(result).forEach(key => {
          if (!isCircularReference(result[key])) {
            filteredResult[key] = result[key];
          }
        });
        return filteredResult;
      }
      
      return result;
    } catch (error) {
      console.warn('Safe selector error:', error);
      return {};
    }
  };
};

/**
 * Safe JSON stringify that handles circular references
 * @param {*} obj - Object to stringify
 * @param {number} space - Spacing for formatting
 * @returns {string} - JSON string
 */
export const safeStringify = (obj, space = 0) => {
  const seen = new WeakSet();
  
  return JSON.stringify(obj, (key, value) => {
    // Handle circular references
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular Reference]';
      }
      seen.add(value);
      
      // Skip known circular objects
      if (isCircularReference(value)) {
        return '[Circular Object]';
      }
    }
    
    return value;
  }, space);
};

/**
 * Shallow comparison for React.memo
 * @param {Object} prevProps - Previous props
 * @param {Object} nextProps - Next props
 * @param {Array} propsToCompare - Array of prop names to compare
 * @returns {boolean} - Whether props are equal
 */
export const createShallowComparison = (propsToCompare = []) => {
  return (prevProps, nextProps) => {
    if (propsToCompare.length === 0) {
      // Compare all props if none specified
      const prevKeys = Object.keys(prevProps);
      const nextKeys = Object.keys(nextProps);
      
      if (prevKeys.length !== nextKeys.length) return false;
      
      return prevKeys.every(key => {
        if (isCircularReference(prevProps[key])) {
          return prevProps[key] === nextProps[key];
        }
        return safeDeepEqual(prevProps[key], nextProps[key]);
      });
    }
    
    // Compare only specified props
    return propsToCompare.every(prop => {
      const [obj, ...path] = prop.split('.');
      const prevVal = path.reduce((o, p) => o?.[p], prevProps[obj]);
      const nextVal = path.reduce((o, p) => o?.[p], nextProps[obj]);
      
      if (isCircularReference(prevVal) || isCircularReference(nextVal)) {
        return prevVal === nextVal;
      }
      
      return safeDeepEqual(prevVal, nextVal);
    });
  };
};

/**
 * Debounced state update to prevent rapid re-renders
 * @param {Function} setState - State setter function
 * @param {number} delay - Debounce delay in ms
 * @returns {Function} - Debounced setter
 */
export const createDebouncedSetter = (setState, delay = 100) => {
  let timeout;
  
  return (newState) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      setState(newState);
    }, delay);
  };
};