/*
  SafeSurf by Team Cyber Titans (Dev: Ankan)
  File: background.js (The "Brain")
  
  This version includes ALL 4 CHECKS:
  1. VirusTotal (API)
  2. Domain Age (API)
  3. Typosquatting (Local)
  4. Content Aware (Local)
  
  It also runs all checks in parallel so it's fast.
*/

// --- 1. SET YOUR API KEYS HERE ---
const VIRUSTOTAL_API_KEY = '8bf35e7c3e80f3b68d7a83d8e091f48cbe25c47194f39cdb66cbe94b61d4a6d4';
const WHOISXML_API_KEY = 'at_3dzs2AXMiRAJpmMFf5w6R6nu1v8KL';

// --- 2. DOMAINS FOR TYPOSQUATTING CHECK ---
const POPULAR_DOMAINS = [
  'google.com', 'facebook.com', 'youtube.com', 'twitter.com', 'instagram.com',
  'linkedin.com', 'microsoft.com', 'apple.com', 'amazon.com', 'netflix.com',
  'paypal.com', 'ebay.com', 'reddit.com', 'wikipedia.org', 'office.com',
  'gmail.com', 'live.com', 'chase.com', 'bankofamerica.com', 'wellsfargo.com'
];

// --- 3. LISTEN FOR TAB CHANGES ---
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    console.log(`Analyzing new page: ${tab.url}`);
    analyzeUrl(tabId, tab.url);
  }
});

// --- 4. LISTEN FOR POPUP REQUESTS ---
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getSiteStatus') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0];
      if (activeTab && activeTab.url) {
        const domain = new URL(activeTab.url).hostname;
        chrome.storage.local.get([domain], (result) => {
          sendResponse(result[domain] || { status: 'loading', domain: domain });
        });
      } else {
        sendResponse({ status: 'error', reason: 'No active tab found.' });
      }
    });
    return true; // Keep the message channel open for the async response
  }
});

// --- 5. THE MAIN ANALYSIS FUNCTION ---
async function analyzeUrl(tabId, url) {
  const domain = new URL(url).hostname;

  // Set initial "loading" status so popup shows "Analyzing..."
  await chrome.storage.local.set({ [domain]: { status: 'loading', domain: domain, lastChecked: Date.now() } });

  try {
    const analysis = await performChecks(tabId, domain);
    await chrome.storage.local.set({ [domain]: analysis });
    console.log(`Analysis complete for ${domain}:`, analysis);
  } catch (error) {
    console.error(`Failed to analyze ${domain}:`, error);
    await chrome.storage.local.set({ [domain]: { status: 'error', reason: 'Analysis failed.', domain: domain } });
  }
}

// --- 6. RUN ALL CHECKS IN PARALLEL ---
async function performChecks(tabId, domain) {
  let score = 0;
  let reasons = [];

  // Run all checks at the same time and wait for them all to finish
  const [vtResult, whoisResult, contentResult, typoResult] = await Promise.allSettled([
    checkVirusTotal(domain),
    checkWhois(domain),
    checkContent(tabId),
    checkTyposquatting(domain)
  ]);

  // --- Check 1: VirusTotal ---
  if (vtResult.status === 'fulfilled' && vtResult.value) {
    const vtScore = vtResult.value.data.attributes.last_analysis_stats.malicious;
    if (vtScore > 1) { // More than 1 security vendor flagged it
      score += 50;
      reasons.push(`${vtScore} vendors flagged this as malicious.`);
    }
  } else {
    console.warn('VirusTotal check failed:', vtResult.reason);
  }

  // --- Check 2: Domain Age (Whois) ---
  if (whoisResult.status === 'fulfilled' && whoisResult.value) {
    if (whoisResult.value.WhoisRecord && whoisResult.value.WhoisRecord.createdDate) {
      const createdDate = new Date(whoisResult.value.WhoisRecord.createdDate);
      const ageInDays = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
      
      if (ageInDays < 30) { // Domain is less than 30 days old
        score += 40;
        reasons.push(`Domain is brand new (created ${Math.floor(ageInDays)} days ago).`);
      }
    } else {
      console.warn('Whois data incomplete:', whoisResult.value);
    }
  } else {
    console.warn('Whois check failed:', whoisResult.reason);
  }

  // --- Check 3: Content Aware (Password Field) ---
  if (contentResult.status === 'fulfilled' && contentResult.value && contentResult.value.length > 0) {
    const hasPassword = contentResult.value[0].result;
    if (hasPassword) {
      score += 10;
      reasons.push('Page contains a password field.');
    }
  } else {
    console.warn(`Content script failed (this is OKAY on protected pages):`, contentResult.reason);
  }

  // --- Check 4: Typosquatting ---
  if (typoResult.status === 'fulfilled' && typoResult.value) {
    const typoCheck = typoResult.value;
    if (typoCheck.isTyposquat) {
      score += 30;
      reasons.push(`Looks like a typosquat for "${typoCheck.match}".`);
    }
  } else {
    console.warn('Typosquatting check failed:', typoResult.reason);
  }

  // --- Final Verdict ---
  let finalStatus = 'safe';
  if (score >= 50) {
    finalStatus = 'danger';
  } else if (score > 0) {
    finalStatus = 'warning';
  }

  return {
    status: finalStatus,
    reason: reasons.length > 0 ? reasons.join(' ') : 'This site looks safe.',
    domain: domain,
    score: score,
    lastChecked: Date.now()
  };
}

// --- 7. API & CHECKER FUNCTIONS ---

async function checkVirusTotal(domain) {
  // Key is already hardcoded, remove check
  const response = await fetch(`https://www.virustotal.com/api/v3/domains/${domain}`, {
    headers: { 'x-apikey': VIRUSTOTAL_API_KEY }
  });
  if (!response.ok) {
    throw new Error(`VirusTotal API error: ${response.statusText}`);
  }
  return response.json();
}

async function checkWhois(domain) {
  // Key is already hardcoded, remove check
  const url = `https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOISXML_API_KEY}&domainName=${domain}&outputFormat=JSON`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`WhoisXML API error: ${response.statusText}`);
  }
  return response.json();
}

async function checkContent(tabId) {
  try {
    // Inject the content script into the tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: ['content_script.js']
    });
    return results;
  } catch (err) {
    // This error is EXPECTED on chrome://, web store, and protected google pages
    console.warn(`Content script injection failed: ${err.message}`);
    return null; // Return null instead of throwing an error
  }
}

async function checkTyposquatting(domain) {
  // Levenshtein distance function to check string similarity
  const levenshtein = (a, b) => {
    const matrix = Array(b.length + 1).fill(null).map(() => Array(a.length + 1).fill(null));
    for (let i = 0; i <= a.length; i += 1) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j += 1) matrix[j][0] = j;
    for (let j = 1; j <= b.length; j += 1) {
      for (let i = 1; i <= a.length; i += 1) {
        const indicator = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    return matrix[b.length][a.length];
  };

  for (const popularDomain of POPULAR_DOMAINS) {
    if (domain === popularDomain) {
      return { isTyposquat: false, match: null }; // It's the real site
    }
    const distance = levenshtein(domain, popularDomain);
    if (distance > 0 && distance <= 2) { // 1 or 2 letters different
      return { isTyposquat: true, match: popularDomain };
    }
  }
  return { isTyposquat: false, match: null };
}

