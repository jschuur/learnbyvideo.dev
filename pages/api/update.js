export default async function handler(req, res) {
  // Check for secret to confirm this is a valid request
  if (req.query.secret !== process.env.REVALIDATE_SECRET_TOKEN) {
    return res.status(401).json({ message: 'Invalid token' });
  }

  try {
    await res.unstable_revalidate('/');
    return res.json({ revalidated: true });
  } catch (err) {
    return res.status(500).send('Error revalidating');
  }
}
