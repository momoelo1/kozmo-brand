/* ========================================
   CROSS-BROWSER COMPATIBILITY TEST
   ======================================== */

/**
 * Test function to check if cross-browser margin-top issues are resolved
 * @returns {Object} Test results
 */
export const testCrossBrowserMarginTop = () => {
  const results = {
    normalizeCSS: false,
    marginTopConsistent: false,
    viewportHeight: false,
    browserSpecific: false
  };

  try {
    // Test 1: Check if normalize.css is properly loaded
    const normalizeLink = document.querySelector('link[href*="normalize"]');
    results.normalizeCSS = !!normalizeLink && normalizeLink.href.includes('normalize');

    // Test 2: Check main-content-area margin-top consistency
    const mainContentArea = document.querySelector('.main-content-area');
    if (mainContentArea) {
      const computedStyle = window.getComputedStyle(mainContentArea);
      const marginTop = computedStyle.marginTop;
      results.marginTopConsistent = marginTop === '0px' || marginTop === '0rem' || marginTop === '0';
    }

    // Test 3: Check viewport height calculation
    const viewportHeight = window.innerHeight;
    const documentHeight = document.documentElement.clientHeight;
    results.viewportHeight = Math.abs(viewportHeight - documentHeight) < 10;

    // Test 4: Check browser-specific features
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
    const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
    const isEdge = navigator.userAgent.toLowerCase().includes('edge');
    const isChrome = /chrome/i.test(navigator.userAgent) && !isEdge;

    results.browserSpecific = {
      safari: isSafari,
      firefox: isFirefox,
      edge: isEdge,
      chrome: isChrome
    };

    console.log('Cross-browser margin-top test results:', results);
    return results;

  } catch (error) {
    console.error('Error testing cross-browser compatibility:', error);
    return results;
  }
};

/**
 * Apply browser-specific fixes dynamically
 */
export const applyBrowserSpecificFixes = () => {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');
  const isEdge = navigator.userAgent.toLowerCase().includes('edge');

  // Apply Safari-specific fixes
  if (isSafari) {
    document.documentElement.style.setProperty('--safari-fix', 'true');
  }

  // Apply Firefox-specific fixes
  if (isFirefox) {
    document.documentElement.style.setProperty('--firefox-fix', 'true');
  }

  // Apply Edge-specific fixes
  if (isEdge) {
    document.documentElement.style.setProperty('--edge-fix', 'true');
  }

  console.log('Browser-specific fixes applied');
};

/**
 * Monitor for margin-top changes and log them
 */
export const monitorMarginTopChanges = () => {
  const mainContentArea = document.querySelector('.main-content-area');
  
  if (mainContentArea) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const computedStyle = window.getComputedStyle(mainContentArea);
          console.log('Margin-top changed:', computedStyle.marginTop);
        }
      });
    });

    observer.observe(mainContentArea, {
      attributes: true,
      attributeFilter: ['style']
    });

    console.log('Margin-top monitoring started');
  }
}; 