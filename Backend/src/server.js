import express from "express";
import dotenv, { parse } from "dotenv";
import { initDB } from "./config/db.js"; 
import rateLimiter from "./middleware/rateLimiter.js";
import transactionsRoute from "./routes/transactionsRoute.js";

dotenv.config();

const app = express();

// middlware
app.use(rateLimiter);
app.use(express.json());

// our custom middleware
// app.use((req, res, next) => {
//     console.log("Hey we hit a request, the method is", req.method);
//     next();
// });

const PORT = process.env.PORT || 5001;


app.get("/", (req, res) => {
    res.send("Hello from the server!");
});

app.use("/api/transactions", transactionsRoute);

initDB().then (() => {
    app.listen(PORT, () => {
        console.log("server is up and running on PORT:", PORT);
    });
});