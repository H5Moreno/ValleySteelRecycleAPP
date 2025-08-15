import express from "express";
import { 
    checkAdminStatus, 
    getAllInspections, 
    updateInspection, 
    adminDeleteInspection, 
    getInspectionStats, 
    getDefectiveItemsStats,
    getAdminSingleInspection,
    getAllUsers,          
    updateUserRole,       
    promoteUserToAdmin    
} from "../controllers/adminController.js";

const router = express.Router();

// Existing routes
router.get("/check/:userId", checkAdminStatus);
router.get("/inspections/:userId", getAllInspections);
router.put("/inspections/:id", updateInspection);
router.delete("/inspections/:id", adminDeleteInspection);
router.get("/stats/:userId", getInspectionStats);
router.get("/defective-items-stats/:userId", getDefectiveItemsStats);
router.post("/single-inspection/:id", getAdminSingleInspection);

// New user management routes
router.get("/users/:userId", getAllUsers);                    // Get all users
router.put("/users/:userId/role", updateUserRole);           // Update user role
router.post("/promote-admin", promoteUserToAdmin);           // Promote user to admin by email

export default router;