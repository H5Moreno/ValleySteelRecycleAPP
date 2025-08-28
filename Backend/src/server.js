import express from "express";
import dotenv, { parse } from "dotenv";
import cors from "cors";
import { initDB } from "./config/db.js"; 
import rateLimiter from "./middleware/rateLimiter.js";
import inspectionsRoute from "./routes/inspectionsRoute.js";
import adminRoute from "./routes/adminRoute.js";
import job from "./config/cron.js";

dotenv.config();

const app = express();

if(process.env.NODE_ENV === "production") job.start();

// middleware
app.use(cors());
app.use(rateLimiter);
app.use(express.json());

const PORT = process.env.PORT || 5001;

app.get("/api/health", (req, res) => {
    res.status(200).json({ message: "API is healthy" });
});

app.get("/", (req, res) => {
    res.send("Hello from the server!");
});

app.use("/api/inspections", inspectionsRoute);
app.use("/api/admin", adminRoute);

initDB().then (() => {
    app.listen(PORT, () => {
        console.log("server is up and running on PORT:", PORT);
    });
});