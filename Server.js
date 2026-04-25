







// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import path from "path";
// import connection from "./connection.js";
// import router from "./Router.js";

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// // uploaded files / images access ചെയ്യാൻ
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// // api routes
// app.use("/api", router);

// connection()
//   .then(() => {
//     app.listen(process.env.PORT, () => {
//       console.log(`Server running at http://localhost:${process.env.PORT}`);
//     });
//   })
//   .catch((err) => console.log(err));



























// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import path from "path";
// import connection from "./connection.js";
// import router from "./Router.js";

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());

// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/api", router);

// connection()
//   .then(() => {
//     app.listen(process.env.PORT, () => {
//       console.log(`Server running at http://localhost:${process.env.PORT}`);
//     });
//   })
//   .catch((err) => console.log(err));














































// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import path from "path";
// import connection from "./connection.js";
// import router from "./Router.js";

// dotenv.config();

// const app = express();


// app.use(cors());

// app.use(express.json());

// app.use(express.urlencoded({ extended: true }));
// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/api", router);

// connection()
//   .then(() => {
//     app.listen(process.env.PORT, () => {
//       console.log(`✅ Server running at http://localhost:${process.env.PORT}`);
//     });
//   })
//   .catch((err) => {
//     console.log("❌ DB Connection Error:", err);
//   });









































// import cors from "cors";
// import dotenv from "dotenv";
// import express from "express";
// import path from "path";
// import connection from "./Connection.js";
// import router from "./Router.js";
// import seedDefaultCategories from "./seedDefaultCategories.js";

// dotenv.config();

// const app = express();

// app.use(cors());
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
// app.use("/api", router);

// connection()
//   .then(async () => {
//     await seedDefaultCategories();

//     app.listen(process.env.PORT, () => {
//       console.log(`✅ Server running at http://localhost:${process.env.PORT}`);
//     });
//   })
//   .catch((err) => console.log(err));


































import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import path from "path";
import connection from "./connection.js";
import router from "./Router.js";
import seedDefaultCategories from "./seedDefaultCategories.js";





dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use("/api", router);

connection()
  .then(async () => {
    await seedDefaultCategories();

    app.listen(process.env.PORT, () => {
      console.log(`✅ Server running at http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.log(err));