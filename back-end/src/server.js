import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import engineRoutes from "./routes/engineRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "UAV Engine Backend is running 🚀"
  });
});

app.use("/api/engines", engineRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});