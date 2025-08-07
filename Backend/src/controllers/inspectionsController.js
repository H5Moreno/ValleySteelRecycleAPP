import { sql } from "../config/db.js";

export async function getInspectionsByUserId(req, res) {
    try {
        const { userId } = req.params;
        
        const result = await sql`
            SELECT * FROM vehicle_inspections WHERE user_id = ${userId} ORDER BY created_at DESC
        `;
        
        // Return just the rows array, not the entire database response object
        res.status(200).json(result.rows || result);
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
        const { id } = req.params;
        
        const result = await sql`
            SELECT * FROM vehicle_inspections 
            WHERE id = ${id}
        `;
        
        if (result.length === 0) {
            return res.status(404).json({ error: "Inspection not found" });
        }
        
        res.status(200).json(result[0]);
    } catch (error) {
        console.error("Error fetching single inspection:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}