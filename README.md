🛡️ SafeSurf

Surf the web with confidence. SafeSurf is your real-time, multi-layered shield against phishing and online threats.

Built by Team Cyber Titans (Dev: Ankan) for the [Your Hackathon Name Here].

(This is a placeholder: replace this with a GIF of your extension working!)

✨ Core Features

SafeSurf is a smart security dashboard that analyzes every site you visit. It provides a clear, simple status (SAFE, WARNING, or DANGER) based on a powerful, multi-layered analysis.

🛡️ Multi-API Threat Check: Instantly cross-references the domain with the VirusTotal database, checking it against 70+ top antivirus scanners and domain blocklisting services.

📅 Zero-Day Threat Analysis: Automatically checks the domain's registration date via the WhoisXML API. A website that was created 2 hours ago and is asking for your bank password? SafeSurf flags that as a critical risk.

🔍 Smart Content-Aware Scan: Intelligently scans the page's HTML in real-time. If a non-standard or suspicious site is asking for a password, your risk score increases.

🎯 Typosquatting Protection: Protects you from common "fat-finger" attacks like gooogle.com or facebo0k.com. Our logic checks for common misspellings of popular sites to catch fakes.

🔑 Built-in Secure Password Generator: Create strong, random passwords directly from the extension popup. Includes options for length, numbers, and symbols to keep all your new accounts secure.

🚀 How It Works

When you navigate to a new page, SafeSurf's background "brain" (background.js) instantly gets to work.

It runs all 4 security checks in parallel:

Calls the VirusTotal API.

Calls the WhoisXML API.

Checks the typosquatting list.

Injects a content script to scan the page for password fields.

A "risk score" is calculated based on the results. (e.g., +10 for a new domain, +30 for a VirusTotal flag).

The final result ({status: 'safe', reason: '...'}) is saved to local storage.

The popup UI (popup.js) reads this status and displays a clear, color-coded result, giving you an instant verdict on your safety.

🛠️ How to Install & Run

This is an unpacked Chrome extension.

Clone this repository (or download it as a ZIP).

Open Google Chrome and navigate to chrome://extensions.

Turn on "Developer mode" in the top-right corner.

Click the "Load unpacked" button.

Select the entire SafeSurf folder.

The 🛡️ SafeSurf icon will appear in your toolbar. Pin it and you're ready!

⚠️ Configuration (CRITICAL!)

To function, SafeSurf requires 2 free API keys.

VirusTotal API Key:

Sign up for a free account at virustotal.com.

Find your API key in your profile settings.

WhoisXML API Key:

Sign up for a free account at whoisxmlapi.com.

Your API key will be on your dashboard.

Add Your Keys:

Open the SafeSurf/background.js file.

Paste your keys into the VIRUSTOTAL_API_KEY and WHOISXML_API_KEY variables at the top of the file.

Reload the extension in chrome://extensions and it will be fully functional!

💻 Tech Stack

JavaScript (ES6+)

HTML5

CSS3 (Plain CSS, styled to look modern)

Chrome Extension API (Manifest V3)

APIs: VirusTotal, WhoisXML

📄 License

This project is licensed under the MIT License.
