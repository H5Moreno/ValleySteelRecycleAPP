import { sql } from "../config/db.js";

// Check if user is admin
export async function checkAdminStatus(req, res) {
    try {
        const { userId } = req.params;
        
        const result = await sql`
            SELECT role FROM users WHERE id = ${userId}
        `;
        
        const isAdmin = result.rows?.[0]?.role === 'admin';
        res.status(200).json({ isAdmin });
    } catch (error) {
        console.error("Error checking admin status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Get all inspections for admin
export async function getAllInspections(req, res) {
    try {
        const { userId } = req.params;
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${userId}`;
        if (adminCheck.rows?.[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        const inspections = await sql`
            SELECT vi.*, u.email as user_email 
            FROM vehicle_inspections vi 
            LEFT JOIN users u ON vi.user_id = u.id 
            ORDER BY vi.created_at DESC
        `;
        
        res.status(200).json(inspections.rows || inspections);
    } catch (error) {
        console.error("Error fetching all inspections:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Update inspection (admin only)
export async function updateInspection(req, res) {
    try {
        const { id } = req.params;
        const { adminUserId, ...updateData } = req.body;
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${adminUserId}`;
        if (adminCheck.rows?.[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }

        const { 
            location, 
            date,
            time,
            vehicle, 
            speedometer_reading,
            defective_items,
            truck_trailer_items,
            trailer_number,
            remarks,
            condition_satisfactory,
            driver_signature,
            defects_corrected,
            defects_need_correction,
            mechanic_signature
        } = updateData;

        const result = await sql`
            UPDATE vehicle_inspections 
            SET 
                location = ${location},
                date = ${date},
                time = ${time},
                vehicle = ${vehicle},
                speedometer_reading = ${speedometer_reading},
                defective_items = ${JSON.stringify(defective_items)},
                truck_trailer_items = ${JSON.stringify(truck_trailer_items)},
                trailer_number = ${trailer_number},
                remarks = ${remarks},
                condition_satisfactory = ${condition_satisfactory},
                driver_signature = ${driver_signature},
                defects_corrected = ${defects_corrected},
                defects_need_correction = ${defects_need_correction},
                mechanic_signature = ${mechanic_signature},
                updated_at = CURRENT_TIMESTAMP,
                updated_by = ${adminUserId}
            WHERE id = ${id}
            RETURNING *
        `;

        if (result.rows?.length === 0) {
            return res.status(404).json({ error: "Inspection not found" });
        }

        res.status(200).json(result.rows?.[0] || result[0]);
    } catch (error) {
        console.error("Error updating inspection:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Delete inspection (admin only)
export async function adminDeleteInspection(req, res) {
    try {
        const { id } = req.params;
        const { adminUserId } = req.body;
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${adminUserId}`;
        if (adminCheck.rows?.[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }

        const result = await sql`
            DELETE FROM vehicle_inspections WHERE id = ${id} RETURNING *
        `;

        if (result.rows?.length === 0) {
            return res.status(404).json({ error: "Inspection not found" });
        }

        res.status(200).json({ message: "Inspection deleted successfully" });
    } catch (error) {
        console.error("Error deleting inspection:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

// Get inspection statistics
export async function getInspectionStats(req, res) {
    try {
        const { userId } = req.params;
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${userId}`;
        if (adminCheck.rows?.[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }

        const stats = await sql`
            SELECT 
                COUNT(*) as total_inspections,
                COUNT(CASE WHEN condition_satisfactory = true THEN 1 END) as satisfactory_count,
                COUNT(CASE WHEN condition_satisfactory = false THEN 1 END) as unsatisfactory_count,
                COUNT(CASE WHEN defects_need_correction = true THEN 1 END) as needs_correction_count,
                COUNT(DISTINCT user_id) as total_users,
                COUNT(CASE WHEN DATE(created_at) = CURRENT_DATE THEN 1 END) as today_inspections
            FROM vehicle_inspections
        `;

        res.status(200).json(stats.rows?.[0] || stats[0]);
    } catch (error) {
        console.error("Error getting inspection stats:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getAdminSingleInspection(req, res) {
    try {
        const { id } = req.params;
        const { adminUserId } = req.body;
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${adminUserId}`;
        if (adminCheck.rows?.[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        const result = await sql`
            SELECT vi.*, u.email as user_email 
            FROM vehicle_inspections vi 
            LEFT JOIN users u ON vi.user_id = u.id 
            WHERE vi.id = ${id}
        `;
        
        if (result.rows?.length === 0) {
            return res.status(404).json({ error: "Inspection not found" });
        }
        
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error("Error fetching single inspection:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}