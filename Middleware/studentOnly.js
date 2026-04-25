export default function studentOnly(req, res, next) {
  try {
    // 🔐 user login cheythittundo
    if (!req.user) {
      return res.status(401).json({ msg: "Unauthorized" });
    }

    // 🎓 role check
    if (req.user.role !== "student") {
      return res.status(403).json({ msg: "Only student can access this route" });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}