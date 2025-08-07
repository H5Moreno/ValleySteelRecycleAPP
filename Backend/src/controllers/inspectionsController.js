// import { sql } from "../config/db.js";

// export async function getTransactionsByUserId(req, res) {
//     try {
//         const { userId } = req.params;
        
//         const transactions = await sql`
//             SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC
//         `
//         res.status(200).json(transactions);
//     } catch (error) {
//         console.log("Error fetching transactions:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// }{

// }

// export async function createTransaction(req, res){
//     // title, amount, category, user_id
//     try {
//         const { title, amount, category, user_id } = req.body;

//         if(!title || !amount || !category || !user_id) {
//             return res.status(400).json({ error: "All fields are required" });
//         }

//         const transaction = await sql`
//             INSERT INTO transactions (user_id, title, amount, category)
//             VALUES (${user_id}, ${title}, ${amount}, ${category})
//             RETURNING *
//         `
//         console.log(transaction)
//         res.status(201).json(transaction[0]);

//     } catch (error) {
//         console.error("Error creating transaction:", error);
//         res.status(500).json({ error: "Internal server error" });      
//     }
// }

// export async function deleteTransaction (req, res) {
//     try {
//         const {id} = req.params;

//         if (isNaN(parseInt(id))) {
//             return res.status(400).json({ message: "Invalid transaction ID" });
//         }
        
//         const result = await sql`
//             DELETE FROM transactions WHERE id = ${id} RETURNING *
//         `;

//         if (result.length === 0) {
//             return res.status(404).json({ message: "Transaction not found" });
//         }

//         res.status(200).json({ message: "Transaction deleted successfully"});

//     } catch (error) {
//         console.log("Error deleting transactions:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// }

// export async function getSummaryByUser (req, res) {

//     try {
//         const { userId } = req.params;

//         const balanceResult = await sql`
//             SELECT COALESCE(SUM(amount), 0) as balance FROM transactions WHERE user_id = ${userId}
//         `

//         const incomeResult = await sql`
//             SELECT COALESCE(SUM(amount), 0) as income FROM transactions 
//             WHERE user_id = ${userId} AND amount > 0
//         `

//         const expensesResult = await sql`
//             SELECT COALESCE(SUM(amount), 0) as expenses FROM transactions 
//             WHERE user_id = ${userId} AND amount < 0
//         `

//         res.status(200).json({
//             balance: balanceResult[0].balance,
//             income: incomeResult[0].income,
//             expenses: expensesResult[0].expenses,
//         });

//     } catch (error) {
//         console.log("Error getting the summary:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// }

// export async function getSingleTransaction(req, res) {
//     try {
//         const { id } = req.params;
        
//         const result = await sql`
//             SELECT * FROM transactions 
//             WHERE id = ${id}
//         `;
        
//         if (result.length === 0) {
//             return res.status(404).json({ error: "Transaction not found" });
//         }
        
//         res.status(200).json(result[0]);
//     } catch (error) {
//         console.error("Error fetching single transaction:", error);
//         res.status(500).json({ error: "Internal server error" });
//     }
// }
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