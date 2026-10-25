function requireAuth(req, res, next) {
  const user = req.user || null;
  if (!user) {
    return res.status(401).json({ status: 'ERROR', message: 'Authentication required.' });
  }
  next();
}

module.exports = { requireAuth };
