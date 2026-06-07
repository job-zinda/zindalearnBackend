// import jwt from "jsonwebtoken";
// import UserSchema from "../Models/User.js";

// export default async function Auth(req, res, next) {
//   try {
//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//       return res.status(401).json({ msg: "No token provided" });
//     }

//     const token = authHeader.startsWith("Bearer ")
//       ? authHeader.split(" ")[1]
//       : null;

//     if (!token) {
//       return res.status(401).json({ msg: "Invalid token format" });
//     }

//     const decoded = jwt.verify(token, process.env.JWT_TOKEN);

//     const user = await UserSchema.findById(decoded.id);
//     if (!user) {
//       return res.status(401).json({ msg: "User not found" });
//     }

//     // 🔒 ADMIN BLOCK CHECK (IMPORTANT)
//     if (user.isActive === false) {
//       return res.status(403).json({ msg: "Account blocked by admin" });
//     }

//     // 🔥 TOKEN INVALIDATION AFTER PASSWORD CHANGE
//     if (user.passwordChangedAt) {
//       const pwdChangedTime = parseInt(
//         user.passwordChangedAt.getTime() / 1000,
//         10
//       );

//       if (decoded.iat < pwdChangedTime) {
//         return res.status(401).json({
//           msg: "Password changed recently. Please login again."
//         });
//       }
//     }

//     req.user = user;
//     next();
//   } catch (err) {
//     return res.status(401).json({ msg: "Invalid token" });
//   }
// }





























import jwt from "jsonwebtoken";
import UserSchema from "../Models/User.js";

export default async function Auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ msg: "No token provided" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : null;

    if (!token) {
      return res.status(401).json({ msg: "Invalid token format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_TOKEN);

    const user = await UserSchema.findById(decoded.id).select("-pass");

    if (!user) {
      return res.status(401).json({ msg: "User not found" });
    }

    if (user.isActive === false || user.isBlocked === true) {
      return res.status(403).json({ msg: "Account blocked by admin" });
    }

    if (user.passwordChangedAt) {
      const pwdChangedTime = parseInt(
        user.passwordChangedAt.getTime() / 1000,
        10
      );

      if (decoded.iat < pwdChangedTime) {
        return res.status(401).json({
          msg: "Password changed recently. Please login again.",
        });
      }
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Invalid token" });
  }
}