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
    promoteUserToAdmin,
    updateUserEmailsFromClerk,
    fixDuplicateUsers,
    //debugUserSearch,
    bootstrapFirstAdmin    
} from "../controllers/adminController.js";

const router = express.Router();

// BOOTSTRAP ROUTE - Only works when no admins exist
router.post("/bootstrap-first-admin", bootstrapFirstAdmin);

// Existing routes
router.get("/check/:userId", checkAdminStatus);
router.get("/inspections/:userId", getAllInspections);
router.put("/inspections/:id", updateInspection);
router.delete("/inspections/:id", adminDeleteInspection);
router.get("/stats/:userId", getInspectionStats);
router.get("/defective-items-stats/:userId", getDefectiveItemsStats);
router.post("/single-inspection/:id", getAdminSingleInspection);

// User management routes
router.get("/users/:userId", getAllUsers);                    
router.put("/users/:userId/role", updateUserRole);           
router.post("/promote-admin", promoteUserToAdmin);           
router.post("/update-user-emails", updateUserEmailsFromClerk);
router.post("/fix-duplicates", fixDuplicateUsers);
//router.post("/debug-user-search", debugUserSearch);          

export default router;