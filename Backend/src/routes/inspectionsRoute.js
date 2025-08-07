// import express from "express";

// import { createTransaction, deleteTransaction, getTransactionsByUserId, getSummaryByUser, getSingleTransaction } from "../controllers/transactionsController.js";

// const router = express.Router();

// router.post("/", createTransaction);

// router.get("/single/:id", getSingleTransaction);

// router.get("/:userId", getTransactionsByUserId);

// router.delete("/:id", deleteTransaction);

// router.get("/summary/:userId", getSummaryByUser);

// export default router;
import express from "express";
import { 
    createInspection, 
    deleteInspection, 
    getInspectionsByUserId, 
    getSingleInspection 
} from "../controllers/inspectionsController.js";

const router = express.Router();

router.post("/", createInspection);
router.get("/single/:id", getSingleInspection);
router.get("/:userId", getInspectionsByUserId);
router.delete("/:id", deleteInspection);

export default router;