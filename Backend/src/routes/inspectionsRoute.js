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