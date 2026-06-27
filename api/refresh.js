// api/refresh.js
// Called by the SPA when its access token has expired (or on startup).
// Reads the httpOnly refresh-token cookie and exchanges it for a
// fresh access token — the user never sees a login screen again.

export default async function handler(req, res) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)dream_refresh=([^;]+)/);
  const refreshToken = match ? match[1] : null;

  if (!refreshToken) {
    return res.status(401).json({ error: 'no_refresh_token' });
  }

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id:     process.env.GDRIVE_CLIENT_ID,
        client_secret: process.env.GDRIVE_CLIENT_SECRET,
        grant_type:    'refresh_token',
      }),
    });

    if (!tokenRes.ok) {
      // Refresh token revoked or expired — tell the SPA to re-auth
      const err = await tokenRes.text();
      console.error('Refresh failed:', err);
      // Clear the stale cookie
      res.setHeader('Set-Cookie', 'dream_refresh=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
      return res.status(401).json({ error: 'refresh_failed' });
    }

    const { access_token, expires_in } = await tokenRes.json();
    const expiresAt = Date.now() + (expires_in - 60) * 1000;

    res.status(200).json({ access_token, expires_at: expiresAt });
  } catch (e) {
    console.error('refresh error:', e);
    res.status(500).json({ error: 'server_error' });
  }
}
