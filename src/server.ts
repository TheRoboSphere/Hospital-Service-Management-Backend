


// // src/index.ts
// import "dotenv/config";
// import express from "express";
// import cors from "cors";
// import cookieParser from "cookie-parser";
// import { authRouter } from "./routes/auth";
// import { ticketRouter } from "./routes/tickets";
// import { equipmentRouter } from "./routes/equipments";
// import userRouter from "./routes/user.routes";
// import settingsRouter from "./routes/settings";
// import dashboardRouter from "./routes/Dashboard";


// const app = express();
// const allowedOrigins = [
//   "https://hospital-service-management.vercel.app",
//   "http://localhost:5173"
// ];
// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin || allowedOrigins.includes(origin)) {
//       callback(null, true);
//     } else {
//       callback(new Error("Not allowed by CORS"));
//     }
//   },
//   credentials: true
// }));

// app.use(express.json());
// app.use(cookieParser());


// import { unitRouter } from "./routes/units";

// app.use("/api/auth", authRouter);
// app.use("/api/tickets", ticketRouter);
// app.use("/api/users", userRouter);
// app.use("/api/settings", settingsRouter);
// app.use("/api/dashboard", dashboardRouter);
// app.use("/api/units", unitRouter);
// app.use("/api/equipments", equipmentRouter);


// // Health check
// app.get("/api/health", (req, res) => {
//   res.json({ status: "ok" });
// });

// const PORT = process.env.PORT || 4000;

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import { authRouter } from "./routes/auth";
import { ticketRouter } from "./routes/tickets";
import { equipmentRouter } from "./routes/equipments";
import userRouter from "./routes/user.routes";
import settingsRouter from "./routes/settings";
import dashboardRouter from "./routes/Dashboard";
import { unitRouter } from "./routes/units";

const app = express();

const allowedOrigins = [
  "https://hospital-service-management.vercel.app",
 // "http://localhost:5173"
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/users", userRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/units", unitRouter);
app.use("/api/equipments", equipmentRouter);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });
