

// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import http from "http";
// import path from "path";
// import connection from "./Connection.js";
// import router from "./Router.js";
// import seedDefaultCategories from "./seedDefaultCategories.js";
// import { initSocket } from "./socket.js";

// dotenv.config();

// const app = express();
// const server = http.createServer(app);

// app.use(
//   cors({
//     origin: process.env.FRONTEND_URL || "http://localhost:5173",
//     credentials: true,
//   })
// );

// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/api", router);

// initSocket(server);

// const PORT = process.env.PORT || 5000;

// connection()
//   .then(async () => {
//     await seedDefaultCategories();

//     server.listen(PORT, () => {
//       console.log(`✅ Server running at http://localhost:${PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.log(err);
//   });









































































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

// Express 5: do not use app.options('*', …) — bare `*` is invalid path-to-regexp and crashes or misroutes preflight.
// `app.use(cors(...))` already handles OPTIONS preflight for all paths.
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