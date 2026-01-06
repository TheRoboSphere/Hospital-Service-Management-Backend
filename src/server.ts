


// src/index.ts
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


const app = express();

app.use(
  cors({
   origin: "https://hospital-mangement-system-mu.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(cookieParser());
app.use(express.json());



app.use("/api/auth", authRouter);
app.use("/api/tickets", ticketRouter);
app.use("/api/users", userRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/dashboard", dashboardRouter);
// src/app.ts or server.ts


app.use("/api/equipments", equipmentRouter);


// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
