/*
  SafeSurf by Team Cyber Titans (Dev: Ankan)
  File: content_script.js
  
  This script is injected into the page to look for password fields.
  It sends 'true' if it finds one, 'false' if not.
*/

(function() {
  const hasPasswordField = !!document.querySelector('input[type="password"]');
  // Return the result
  return hasPasswordField;
})();

