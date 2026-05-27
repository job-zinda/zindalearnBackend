// function parseOriginList(value) {
//   if (!value || typeof value !== "string") return [];
//   return value
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);
// }

// function buildExplicitOrigins() {
//   const fromEnv = [
//     ...parseOriginList(process.env.FRONTEND_URL),
//     ...parseOriginList(process.env.ADDITIONAL_CORS_ORIGINS),
//   ];
//   const defaults = [
//     "http://localhost:5173",
//     "http://localhost:3000",
//     "https://www.zindaonlineschool.com",
//     "https://zindaonlineschool.com",
//     "https://zinda-learn-frontend.vercel.app",
//     "https://jobzinda.vercel.app",
//   ];
//   return [...new Set([...defaults, ...fromEnv])];
// }

// /**
//  * @param {string | undefined} origin Request Origin header (absent for same-origin / some tools)
//  */
// export function isOriginAllowed(origin) {
//   if (!origin) return true;

//   const explicit = buildExplicitOrigins();
//   if (explicit.includes(origin)) return true;

//   try {
//     const { hostname, protocol } = new URL(origin);
//     if (protocol !== "https:" && protocol !== "http:") return false;
//     if (hostname === "localhost") return true;
//     if (hostname === "vercel.app" || hostname.endsWith(".vercel.app")) return true;
//     return false;
//   } catch {
//     return false;
//   }
// }




































import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import path from "path";
import connection from "./Connection.js";
import router from "./Router.js";
import seedDefaultCategories from "./seedDefaultCategories.js";
import { initSocket } from "./socket.js";
import { isOriginAllowed } from "./utils/corsOrigins.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin(origin, callback) {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", router);

initSocket(server);

const PORT = process.env.PORT || 5000;

connection()
  .then(async () => {
    await seedDefaultCategories();

    server.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log(err);
  });