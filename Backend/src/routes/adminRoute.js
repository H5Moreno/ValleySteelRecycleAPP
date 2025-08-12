import express from "express";
import { 
    checkAdminStatus,
    getAllInspections,
    updateInspection,
    adminDeleteInspection,
    getInspectionStats,
    getAdminSingleInspection,
    getDefectiveItemsStats
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/check/:userId", checkAdminStatus);
router.get("/inspections/:userId", getAllInspections);
router.get("/stats/:userId", getInspectionStats);
router.get("/defective-items-stats/:userId", getDefectiveItemsStats);
router.put("/inspections/:id", updateInspection);
router.delete("/inspections/:id", adminDeleteInspection);
router.post("/single-inspection/:id", getAdminSingleInspection);

export default router;