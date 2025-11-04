/*
  SafeSurf by Team Cyber Titans (Dev: Ankan)
  File: popup.js
  
  This is a new, simpler, and more robust version.
  It fixes the "Analyzing..." bug by relying *only* on the
  chrome.storage.local.get and chrome.storage.onChanged listeners.
*/

document.addEventListener('DOMContentLoaded', () => {
  // --- Setup Elements ---
  const statusLoading = document.getElementById('status-loading');
  const statusResult = document.getElementById('status-result');
  const statusDomain = document.getElementById('status-domain');
  const statusText = document.getElementById('status-text');
  const statusReason = document.getElementById('status-reason');

  const genButton = document.getElementById('generate-btn');
  const copyButton = document.getElementById('copy-btn');
  const passResult = document.getElementById('password-result');
  
  const copyBtnText = document.createElement('span');
  copyBtnText.textContent = 'Copy';
  copyBtnText.style.display = 'none';
  copyButton.appendChild(copyBtnText);

  // --- 1. GET CURRENT TAB AND UPDATE UI ---
  // This is the main function that runs when the popup opens
  function getStatusForCurrentTab() {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0 || !tabs[0].url) {
        updateStatusUI({ status: 'error', reason: 'No active tab found.' });
        return;
      }
      
      try {
        const domain = new URL(tabs[0].url).hostname;
        
        // Immediately get the *current* status from storage
        chrome.storage.local.get([domain], (result) => {
          const currentStatus = result[domain] || { status: 'loading', domain: domain };
          updateStatusUI(currentStatus);
        });
      } catch (e) {
        updateStatusUI({ status: 'error', reason: 'Not a valid web page.', domain: 'Invalid URL' });
      }
    });
  }

  // --- 2. LISTEN FOR *LIVE* STORAGE CHANGES ---
  // This updates the UI *live* if the background.js finishes analysis
  // *while* the popup is open.
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0 || !tabs[0].url) return;
        
        try {
          const domain = new URL(tabs[0].url).hostname;
          if (changes[domain]) {
            const newStatus = changes[domain].newValue;
            if (newStatus) {
              updateStatusUI(newStatus);
            }
          }
        } catch (e) {
          // Do nothing, not a valid tab
        }
      });
    }
  });

  // --- 3. UI UPDATE FUNCTION ---
  function updateStatusUI(statusData) {
    if (!statusData || !statusData.status) {
      console.warn("Invalid status data received", statusData);
      return;
    }
    
    statusDomain.textContent = statusData.domain || 'Current Page';

    if (statusData.status === 'loading') {
      statusLoading.classList.remove('hidden');
      statusResult.classList.add('hidden');
    } else {
      statusLoading.classList.add('hidden');
      statusResult.classList.remove('hidden');

      statusReason.textContent = statusData.reason || 'No details.';
      statusText.classList.remove('text-green-600', 'text-yellow-600', 'text-red-600', 'text-gray-700');

      switch (statusData.status) {
        case 'safe':
          statusText.textContent = 'SAFE';
          statusText.classList.add('text-green-600');
          break;
        case 'warning':
          statusText.textContent = 'WARNING';
          statusText.classList.add('text-yellow-600');
          break;
        case 'danger':
          statusText.textContent = 'DANGER';
          statusText.classList.add('text-red-600');
          break;
        case 'error':
        default:
          statusText.textContent = 'Error';
          statusText.classList.add('text-gray-700');
          statusReason.textContent = statusData.reason || 'Analysis failed.';
          break;
      }
    }
  }

  // --- 4. PASSWORD GENERATOR (Unchanged) ---
  genButton.addEventListener('click', () => {
    const length = document.getElementById('pass-length').value;
    const includeNumbers = document.getElementById('pass-numbers').checked;
    const includeSymbols = document.getElementById('pass-symbols').checked;
    passResult.value = generatePassword(length, includeNumbers, includeSymbols);
  });

  copyButton.addEventListener('click', () => {
    passResult.select();
    document.execCommand('copy');
    const svg = copyButton.querySelector('svg');
    const textSpan = copyButton.querySelector('span');
    if (svg) svg.style.display = 'none';
    textSpan.textContent = 'Copied!';
    textSpan.style.display = 'inline';
    textSpan.style.color = '#2563eb';
    setTimeout(() => {
      textSpan.style.display = 'none';
      if (svg) svg.style.display = 'inline';
    }, 2000);
  });

  function generatePassword(length, numbers, symbols) {
    let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    if (numbers) chars += '0123456789';
    if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  // --- 5. RUN THE SCRIPT ---
  // This is what we call when the popup opens.
  getStatusForCurrentTab();
});

