// api/auth-login.js
// Redirects the user to Google's OAuth2 consent screen.

export default function handler(req, res) {
  const clientId = process.env.GDRIVE_CLIENT_ID;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/auth-callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: [
      'https://www.googleapis.com/auth/drive.appdata',
    ].join(' '),
    access_type: 'offline',
    prompt: 'consent',          // always get refresh_token
  });

  res.redirect(302, `https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}
