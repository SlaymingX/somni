// api/auth-callback.js
// Google redirects here after the user consents.
// Exchanges the one-time `code` for access + refresh tokens,
// stores the refresh token in an httpOnly cookie, and
// redirects back to the SPA with the access token in the hash
// (so the frontend can start using Drive immediately without
//  another round-trip).

export default async function handler(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(302, `/?auth_error=${encodeURIComponent(error || 'no_code')}`);
  }

  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const redirectUri = `${proto}://${host}/api/auth-callback`;

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     process.env.GDRIVE_CLIENT_ID,
        client_secret: process.env.GDRIVE_CLIENT_SECRET,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Token exchange failed:', err);
      return res.redirect(302, '/?auth_error=token_exchange');
    }

    const tokens = await tokenRes.json();
    const { access_token, refresh_token, expires_in } = tokens;

    // Store refresh token in httpOnly cookie (survives page reloads / app restarts)
    // Max-age: 180 days; the user re-auths only if they clear cookies.
    if (refresh_token) {
      res.setHeader('Set-Cookie', [
        `dream_refresh=${refresh_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 180}`,
      ]);
    }

    // Pass short-lived access token to the SPA via the URL fragment
    // (fragment is never sent to the server, reasonably safe)
    const expiresAt = Date.now() + (expires_in - 60) * 1000;
    const fragment = new URLSearchParams({
      access_token,
      expires_at: expiresAt,
    });

    res.redirect(302, `/?#${fragment}`);
  } catch (e) {
    console.error('auth-callback error:', e);
    res.redirect(302, '/?auth_error=server');
  }
}
