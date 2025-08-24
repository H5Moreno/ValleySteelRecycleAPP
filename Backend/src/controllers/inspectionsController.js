import { sql } from "../config/db.js";

export async function getInspectionsByUserId(req, res) {
    try {
        const { userId } = req.params;
        const { userEmail } = req.query; // Get email from query parameters
        console.log('Fetching inspections for user:', userId);
        console.log('User email provided:', userEmail);
        
        // 🔧 AUTO-CREATE USER IN DATABASE IF NOT EXISTS
        try {
            console.log('🔄 Ensuring user exists in database...');
            const actualEmail = userEmail || (userId + '@clerk.user');
            
            // First, check if there's an existing user with this email but different ID
            // This handles the case where user was promoted by email before first login
            const existingUserByEmail = await sql`
                SELECT id, email, role FROM users 
                WHERE email = ${actualEmail} AND id != ${userId}
            `;
            const existingUser = (existingUserByEmail.rows || existingUserByEmail)[0];
            
            if (existingUser && actualEmail !== userId + '@clerk.user') {
                // User exists with this email but different ID - update their ID to the Clerk ID
                console.log(`🔄 Found existing user with email ${actualEmail}, updating ID from ${existingUser.id} to ${userId}`);
                
                await sql`
                    UPDATE users 
                    SET id = ${userId}
                    WHERE email = ${actualEmail} AND id = ${existingUser.id}
                `;
                
                // Also update any existing inspection records
                await sql`
                    UPDATE vehicle_inspections 
                    SET user_id = ${userId}
                    WHERE user_id = ${existingUser.id}
                `;
                
                console.log('✅ User ID updated to match Clerk ID, preserving admin role');
            } else {
                // Normal user creation/update
                await sql`
                    INSERT INTO users (id, email, role) 
                    VALUES (${userId}, ${actualEmail}, 'user')
                    ON CONFLICT (id) DO UPDATE SET 
                        email = CASE 
                            WHEN users.email LIKE '%@clerk.user' AND ${userEmail} IS NOT NULL 
                            THEN ${actualEmail}
                            ELSE users.email 
                        END
                `;
                console.log('✅ User ensured in database with email:', actualEmail);
            }
        } catch (userError) {
            console.log('⚠️ User creation failed (may already exist):', userError.message);
        }
        
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
            user_email, // Add this field
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

        // 🔧 AUTO-CREATE USER IN DATABASE IF NOT EXISTS
        try {
            console.log('🔄 Ensuring user exists in database...');
            await sql`
                INSERT INTO users (id, email, role) 
                VALUES (${user_id}, ${user_email || user_id + '@clerk.user'}, 'user')
                ON CONFLICT (id) DO NOTHING
            `;
            console.log('✅ User ensured in database');
        } catch (userError) {
            console.log('⚠️ User creation failed (may already exist):', userError.message);
        }

        // 🔒 SECURITY: Check if user is admin before allowing mechanic signature
        let finalMechanicSignature = "";
        if (mechanic_signature && mechanic_signature.trim()) {
            console.log('🔍 Checking admin status for mechanic signature...');
            try {
                const userCheck = await sql`
                    SELECT role FROM users WHERE id = ${user_id}
                `;
                const userData = userCheck.rows?.[0] || userCheck[0];
                
                if (userData && userData.role === 'admin') {
                    finalMechanicSignature = mechanic_signature.trim();
                    console.log('✅ Admin user - mechanic signature allowed');
                } else {
                    console.log('⚠️ Non-admin user - mechanic signature rejected');
                    // Don't return error, just silently ignore mechanic signature for non-admins
                }
            } catch (adminCheckError) {
                console.error('❌ Error checking admin status:', adminCheckError);
                // If we can't check admin status, don't allow mechanic signature
            }
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
                ${defects_need_correction}, ${finalMechanicSignature}
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
        const { userId, userEmail } = req.query; // Get userId and userEmail from query params
        console.log('Fetching inspection ID:', id, 'for user:', userId);
        console.log('User email provided:', userEmail);
        
        if (!id) {
            return res.status(400).json({ error: "Inspection ID is required" });
        }
        
        // 🔧 AUTO-CREATE USER IN DATABASE IF NOT EXISTS
        if (userId) {
            try {
                console.log('🔄 Ensuring user exists in database...');
                const actualEmail = userEmail || (userId + '@clerk.user');
                
                // First, check if there's an existing user with this email but different ID
                const existingUserByEmail = await sql`
                    SELECT id, email, role FROM users 
                    WHERE email = ${actualEmail} AND id != ${userId}
                `;
                const existingUser = (existingUserByEmail.rows || existingUserByEmail)[0];
                
                if (existingUser && actualEmail !== userId + '@clerk.user') {
                    // User exists with this email but different ID - update their ID
                    console.log(`🔄 Found existing user with email ${actualEmail}, updating ID from ${existingUser.id} to ${userId}`);
                    
                    await sql`
                        UPDATE users 
                        SET id = ${userId}
                        WHERE email = ${actualEmail} AND id = ${existingUser.id}
                    `;
                    
                    // Also update any existing inspection records
                    await sql`
                        UPDATE vehicle_inspections 
                        SET user_id = ${userId}
                        WHERE user_id = ${existingUser.id}
                    `;
                    
                    console.log('✅ User ID updated to match Clerk ID');
                } else {
                    // Normal user creation/update
                    await sql`
                        INSERT INTO users (id, email, role) 
                        VALUES (${userId}, ${actualEmail}, 'user')
                        ON CONFLICT (id) DO UPDATE SET 
                            email = CASE 
                                WHEN users.email LIKE '%@clerk.user' AND ${userEmail} IS NOT NULL 
                                THEN ${actualEmail}
                                ELSE users.email 
                            END
                    `;
                    console.log('✅ User ensured in database with email:', actualEmail);
                }
            } catch (userError) {
                console.log('⚠️ User creation failed (may already exist):', userError.message);
            }
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
