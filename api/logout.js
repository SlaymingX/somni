// api/logout.js
// Clears the httpOnly refresh-token cookie and revokes the token at Google.

export default async function handler(req, res) {
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(/(?:^|;\s*)dream_refresh=([^;]+)/);
  const refreshToken = match ? match[1] : null;

  // Revoke at Google (best-effort, don't block on failure)
  if (refreshToken) {
    fetch(`https://oauth2.googleapis.com/revoke?token=${refreshToken}`, { method: 'POST' })
      .catch(() => {});
  }

  res.setHeader('Set-Cookie', 'dream_refresh=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0');
  res.status(200).json({ ok: true });
}
