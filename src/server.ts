// import express from "express";
// import userRoutes from "./routes/user.routes";
// import dotenv from "dotenv";

// dotenv.config();

// const app = express();
// app.use(express.json());

// // Routes
// app.use("/test", userRoutes);

// app.get("/", (_req, res) => {
//   res.send("Drizzle + Express API Running 🚀");
// });

// const PORT = 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));


// src/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { authRouter } from "./routes/auth";
import { ticketRouter } from "./routes/tickets";

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173", // your React URL
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
