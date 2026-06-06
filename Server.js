

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

// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:3000",
//   "https://zinda-learn-frontend.vercel.app",
//   process.env.FRONTEND_URL,
// ].filter(Boolean);

// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error(`CORS blocked: ${origin}`));
//       }
//     },
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

// const allowedOrigins = [
//   "http://localhost:5173",
//   "http://localhost:3000",
//   "https://zinda-learn-frontend.vercel.app",
//   "https://zinda-learn-frontend-rntj.vercel.app",
//   process.env.FRONTEND_URL,
// ].filter(Boolean);

// const corsOptions = {
//   origin(origin, callback) {
//     if (!origin || allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }

//     console.log("CORS blocked:", origin);
//     return callback(new Error(`CORS blocked: ${origin}`));
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization"],
// };

// app.use(cors(corsOptions));
// app.options("*", cors(corsOptions));

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



















































// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import http from "http";
// import path from "path";
// import connection from "./Connection.js";
// import router from "./Router.js";
// import seedDefaultCategories from "./seedDefaultCategories.js";
// import { initSocket } from "./socket.js";
// import { isOriginAllowed } from "./utils/corsOrigins.js";

// dotenv.config();

// const app = express();
// const server = http.createServer(app);

// const corsOptions = {
//   origin(origin, callback) {
//     if (isOriginAllowed(origin)) {
//       callback(null, true);
//     } else {
//       callback(null, false);
//     }
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));


// app.options("*", cors(corsOptions));



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



































// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import http from "http";
// import path from "path";

// import connection from "./Connection.js";
// import router from "./Router.js";
// import seedDefaultCategories from "./seedDefaultCategories.js";
// import { initSocket } from "./socket.js";
// import { isOriginAllowed } from "./utils/corsOrigins.js";

// dotenv.config();

// const app = express();
// const server = http.createServer(app);

// const corsOptions = {
//   origin(origin, callback) {
//     if (isOriginAllowed(origin)) {
//       return callback(null, true);
//     }

//     console.log("❌ CORS blocked origin:", origin);
//     return callback(null, false);
//   },
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//   allowedHeaders: [
//     "Content-Type",
//     "Authorization",
//     "X-Requested-With",
//     "Accept",
//   ],
//   optionsSuccessStatus: 204,
// };

// app.use(cors(corsOptions));

// app.options(/.*/, cors(corsOptions));

// app.use(express.json({ limit: "50mb" }));
// app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// app.get("/", (req, res) => {
//   res.status(200).json({
//     msg: "ZindaLearn backend is running",
//   });
// });

// app.use("/api", router);

// initSocket(server);

// const PORT = process.env.PORT || 5000;

// connection()
//   .then(async () => {
//     await seedDefaultCategories();

//     server.listen(PORT, () => {
//       console.log(`✅ Server running on port ${PORT}`);
//       console.log("✅ FRONTEND_URL:", process.env.FRONTEND_URL);
//       console.log("✅ ADDITIONAL_CORS_ORIGINS:", process.env.ADDITIONAL_CORS_ORIGINS);
//     });
//   })
//   .catch((err) => {
//     console.log("❌ Server start error:", err);
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







const allowedOrigins = [
  "https://www.zindalearn.com",
  "https://zindalearn.com",
  "http://localhost:5173",
  "http://localhost:3000",
];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("❌ CORS blocked origin:", origin);
    return callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));





app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.status(200).json({
    msg: "ZindaLearn backend is running",
  });
});

app.use("/api", router);

initSocket(server);

const PORT = process.env.PORT || 5000;

connection()
  .then(async () => {
    await seedDefaultCategories();

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log("✅ FRONTEND_URL:", process.env.FRONTEND_URL);
      console.log("✅ ADDITIONAL_CORS_ORIGINS:", process.env.ADDITIONAL_CORS_ORIGINS);
    });
  })
  .catch((err) => {
    console.log("❌ Server start error:", err);
  });