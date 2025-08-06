import express from "express";

import { createTransaction, deleteTransaction, getTransactionsByUserId, getSummaryByUser } from "../controllers/transactionsController.js";

const router = express.Router();

router.post("/", createTransaction);

router.get("/:userId", getTransactionsByUserId);

router.delete("/:id", deleteTransaction);

router.get("/summary/:userId", getSummaryByUser);

export default router;