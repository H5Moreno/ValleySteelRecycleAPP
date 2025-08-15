import { sql } from "../config/db.js";

export async function getInspectionsByUserId(req, res) {
    try {
        const { userId } = req.params;
        console.log('Fetching inspections for user:', userId);
        
        const result = await sql`
            SELECT * FROM vehicle_inspections WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        
        console.log('Query result:', result);
        
        // Handle both Vercel Postgres and regular response formats
        const inspections = result.rows || result;
        
        res.status(200).json(inspections);
    } catch (error) {
        console.log("Error fetching inspections:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}
export async function createInspection(req, res){
    try {
        const { 
            user_id, 
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
        } = req.body;

        if(!user_id || !vehicle) {
            return res.status(400).json({ error: "User ID and vehicle are required" });
        }

        const inspection = await sql`
            INSERT INTO vehicle_inspections (
                user_id, location, date, time, vehicle, speedometer_reading,
                defective_items, truck_trailer_items, trailer_number, remarks,
                condition_satisfactory, driver_signature, defects_corrected,
                defects_need_correction, mechanic_signature
            )
            VALUES (
                ${user_id}, ${location}, ${date || new Date()}, ${time}, ${vehicle}, 
                ${speedometer_reading}, ${JSON.stringify(defective_items)}, 
                ${JSON.stringify(truck_trailer_items)}, ${trailer_number}, ${remarks},
                ${condition_satisfactory}, ${driver_signature}, ${defects_corrected},
                ${defects_need_correction}, ${mechanic_signature}
            )
            RETURNING *
        `
        
        res.status(201).json(inspection[0]);

    } catch (error) {
        console.error("Error creating inspection:", error);
        res.status(500).json({ error: "Internal server error" });      
    }
}

export async function deleteInspection (req, res) {
    try {
        const {id} = req.params;

        if (isNaN(parseInt(id))) {
            return res.status(400).json({ message: "Invalid inspection ID" });
        }
        
        const result = await sql`
            DELETE FROM vehicle_inspections WHERE id = ${id} RETURNING *
        `;

        if (result.length === 0) {
            return res.status(404).json({ message: "Inspection not found" });
        }

        res.status(200).json({ message: "Inspection deleted successfully"});

    } catch (error) {
        console.log("Error deleting inspection:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getSingleInspection(req, res) {
    try {
        console.log('=== GET SINGLE INSPECTION ===');
        const { id } = req.params;
        console.log('Fetching inspection ID:', id);
        
        if (!id) {
            return res.status(400).json({ error: "Inspection ID is required" });
        }
        
        const result = await sql`
            SELECT vi.*, u.email as user_email 
            FROM vehicle_inspections vi 
            LEFT JOIN users u ON vi.user_id = u.id 
            WHERE vi.id = ${id}
        `;
        
        const inspectionResult = result.rows || result;
        console.log('Query result:', inspectionResult);
        
        if (!inspectionResult || inspectionResult.length === 0) {
            return res.status(404).json({ error: "Inspection not found" });
        }
        
        const inspection = inspectionResult[0];
        console.log('Found inspection:', inspection);
        
        // Parse JSON fields if they're strings
        if (typeof inspection.defective_items === 'string') {
            try {
                inspection.defective_items = JSON.parse(inspection.defective_items);
            } catch (error) {
                console.error('Error parsing defective_items:', error);
                inspection.defective_items = {};
            }
        }
        
        if (typeof inspection.truck_trailer_items === 'string') {
            try {
                inspection.truck_trailer_items = JSON.parse(inspection.truck_trailer_items);
            } catch (error) {
                console.error('Error parsing truck_trailer_items:', error);
                inspection.truck_trailer_items = {};
            }
        }
        
        console.log('Returning parsed inspection:', inspection);
        res.status(200).json(inspection);
        
    } catch (error) {
        console.error("Error fetching single inspection:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
}
