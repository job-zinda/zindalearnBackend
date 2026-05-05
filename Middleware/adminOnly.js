export default function adminOnly(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ msg: "Only admin can access this route" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

