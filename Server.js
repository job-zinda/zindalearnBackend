

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

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://zinda-learn-frontend.vercel.app",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
  })
);

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