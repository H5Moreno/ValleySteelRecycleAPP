import express from "express";
import dotenv, { parse } from "dotenv";
import { sql } from "./config/db.js"; 

dotenv.config();

const app = express();

// middlware
app.use(express.json());

// our custom middleware
// app.use((req, res, next) => {
//     console.log("Hey we hit a request, the method is", req.method);
//     next();
// });

const PORT = process.env.PORT || 5001;

async function initDB() {
    try {
        await sql`CREATE TABLE IF NOT EXISTS transactions (
            id SERIAL PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            title VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            category VARCHAR(255) NOT NULL,
            created_at DATE NOT NULL DEFAULT CURRENT_DATE
        )`;

        // DECIMAL(10, 2)
        // means: a fixed-point number with:
        // 10 digits total 
        // 2 digits after the decimal point
        // so: the max value it can store is 99999999.99

        console.log("Database initialized successfully.");
    } catch (error) {
        console.error("Error initializing database:", error);
        process.exit(1);
    }
}

app.get("/", (req, res) => {
    res.send("Hello from the server!");
});

app.post("/api/transactions", async (req, res) => {
    // title, amount, category, user_id
    try {
        const { title, amount, category, user_id } = req.body;

        if(!title || !amount || !category || !user_id) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const transaction = await sql`
            INSERT INTO transactions (user_id, title, amount, category)
            VALUES (${user_id}, ${title}, ${amount}, ${category})
            RETURNING *
        `
        console.log(transaction)
        res.status(201).json(transaction[0]);

    } catch (error) {
        console.error("Error creating transaction:", error);
        res.status(500).json({ error: "Internal server error" });      
    }
});

app.get("/api/transactions/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        
        const transactions = await sql`
            SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
        `
        res.status(200).json(transactions);
    } catch (error) {
        console.log("Error fetching transactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.delete("/api/transactions/:id", async (req, res) => {
    try {
        const {id} = req.params;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: "Invalid transaction ID" });
        }
        
        const result = await sql`
            DELETE FROM transactions WHERE id = ${id} RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        res.status(200).json({ message: "Transaction deleted successfully"});

    } catch (error) {
        console.log("Error deleting transactions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/api/transactions/summary/:userId", async (req, res) => {

    try {
        const { userId } = req.params;

        const balanceResult = await sql`
            SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE user_id = ${userId}
        `

        const incomeResult = await sql`
            SELECT COALESCE(SUM(amount), 0) as income FROM transactions 
            WHERE user_id = ${userId} AND amount > 0
        `

        const expensesResult = await sql`
            SELECT COALESCE(SUM(amount), 0) as expenses FROM transactions 
            WHERE user_id = ${userId} AND amount < 0
        `

        res.status(200).json({
            balance: balanceResult[0].balance,
            income: incomeResult[0].income,
            expenses: expensesResult[0].expenses,
        });

    } catch (error) {
        console.log("Error getting the summary:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

initDB().then (() => {
    app.listen(PORT, () => {
        console.log("server is up and running on PORT:", PORT);
    });
});