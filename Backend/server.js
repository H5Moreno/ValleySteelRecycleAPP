import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5001;

app.get("/", (req, res) => {
    res.send("It's workingggggggggggggggg");
})

console.log("my port:",process.env.PORT)

app.listen(PORT, () => {
    console.log("server is up and running on PORT:", PORT);
})