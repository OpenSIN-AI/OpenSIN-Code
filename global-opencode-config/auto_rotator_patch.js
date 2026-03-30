const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const originalFetch = globalThis.fetch;

if (!originalFetch) {
  console.log('[Auto-Rotator] fetch not found globally');
} else {
  globalThis.fetch = async function(url, options) {
    let response = await originalFetch(url, options);

    // Check if it's an OpenAI request and we hit a 429 Rate Limit
    if (response.status === 429 && typeof url === 'string' && (url.includes('openai.com') || url.includes('chatgpt.com'))) {
      console.log('\n[Auto-Rotator] ⚠️ Rate Limit (429) detected! Automatically pulling a fresh token from Supabase pool...');
      
      try {
        // Run the pull script
        const scriptPath = path.join(process.env.HOME, '.local', 'bin', 'mac_pull_script.py');
        execSync(`python3 ${scriptPath}`, { stdio: 'inherit' });

        // Read the new token from auth.json
        const authPath = path.join(process.env.HOME, '.local', 'share', 'opencode', 'auth.json');
        const authData = JSON.parse(fs.readFileSync(authPath, 'utf8'));
        const newAccessToken = authData.openai?.access;

        if (newAccessToken && options && options.headers) {
          // Update the Authorization header
          const newHeaders = new Headers(options.headers);
          newHeaders.set('Authorization', `Bearer ${newAccessToken}`);
          options.headers = newHeaders;
          
          console.log('[Auto-Rotator] ✅ Token updated. Retrying request invisibly...\n');
          // Retry the request with the new token
          response = await originalFetch(url, options);
        }
      } catch (err) {
        console.error('[Auto-Rotator] ❌ Failed to auto-rotate token:', err.message);
      }
    }

    return response;
  };
}
