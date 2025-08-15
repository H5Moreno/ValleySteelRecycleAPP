import { sql } from "../config/db.js";

export async function getAllUsers(req, res) {
    try {
        const { userId } = req.params;
        
        console.log('=== GET ALL USERS REQUEST ===');
        console.log('Requesting user ID:', userId);
        
        // Verify admin status with detailed logging
        console.log('Checking admin status...');
        const adminCheck = await sql`SELECT id, email, role FROM users WHERE id = ${userId}`;
        const adminResult = adminCheck.rows || adminCheck;
        
        console.log('Admin check result:', adminResult);
        console.log('Admin result length:', adminResult.length);
        
        if (!adminResult || adminResult.length === 0) {
            console.log('❌ User not found in database');
            return res.status(403).json({ error: "User not found in database" });
        }
        
        const adminUser = adminResult[0];
        console.log('Found user:', adminUser);
        console.log('User role:', adminUser.role);
        
        if (adminUser.role !== 'admin') {
            console.log('❌ User is not admin, role is:', adminUser.role);
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        console.log('✅ Admin verified, fetching all users...');
        
        // Get all users with inspection counts
        const users = await sql`
            SELECT 
                u.id, 
                u.email, 
                u.role, 
                u.created_at,
                COUNT(i.id) as inspection_count
            FROM users u
            LEFT JOIN vehicle_inspections i ON u.id = i.user_id
            GROUP BY u.id, u.email, u.role, u.created_at
            ORDER BY u.created_at DESC
        `;
        
        const userResults = users.rows || users;
        console.log('Found users:', userResults.length);
        console.log('Users data:', userResults);
        
        res.status(200).json(userResults);
        
    } catch (error) {
        console.error("❌ Error fetching users:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
}

export async function updateUserRole(req, res) {
    try {
        console.log('=== UPDATE USER ROLE REQUEST ===');
        const { userId } = req.params; // User to update
        const { adminUserId, newRole } = req.body; // Admin making the change and new role
        
        console.log('Admin user:', adminUserId);
        console.log('Target user:', userId);
        console.log('New role:', newRole);
        
        if (!userId || !adminUserId || !newRole) {
            return res.status(400).json({ error: "Missing required parameters" });
        }
        
        if (!['user', 'admin'].includes(newRole)) {
            return res.status(400).json({ error: "Invalid role. Must be 'user' or 'admin'" });
        }
        
        // Verify admin status of the person making the change
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${adminUserId}`;
        const adminResult = adminCheck.rows || adminCheck;
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        // Check if target user exists
        const targetUserCheck = await sql`SELECT id, email, role FROM users WHERE id = ${userId}`;
        const targetUserResult = targetUserCheck.rows || targetUserCheck;
        if (!targetUserResult || targetUserResult.length === 0) {
            return res.status(404).json({ error: "User not found" });
        }
        
        const targetUser = targetUserResult[0];
        
        // Prevent admin from demoting themselves (safety check)
        if (adminUserId === userId && newRole !== 'admin') {
            return res.status(400).json({ error: "You cannot remove your own admin privileges" });
        }
        
        // Update the user's role
        const updateResult = await sql`
            UPDATE users 
            SET role = ${newRole}
            WHERE id = ${userId}
            RETURNING id, email, role
        `;
        
        const updatedUser = updateResult.rows?.[0] || updateResult[0];
        
        console.log('✅ User role updated successfully:', updatedUser);
        
        res.status(200).json({ 
            message: `User role updated successfully from '${targetUser.role}' to '${newRole}'`, 
            user: updatedUser
        });
        
    } catch (error) {
        console.error("❌ Error updating user role:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
}

export async function promoteUserToAdmin(req, res) {
    try {
        const { userEmail } = req.body;
        const { adminUserId } = req.body;
        
        console.log('=== PROMOTE USER TO ADMIN ===');
        console.log('Admin user:', adminUserId);
        console.log('Target email:', userEmail);
        
        if (!userEmail || !adminUserId) {
            return res.status(400).json({ error: "Missing user email or admin user ID" });
        }
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${adminUserId}`;
        const adminResult = adminCheck.rows || adminCheck;
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        // Find user by email
        const userCheck = await sql`SELECT id, email, role FROM users WHERE email = ${userEmail}`;
        const userResult = userCheck.rows || userCheck;
        if (!userResult || userResult.length === 0) {
            return res.status(404).json({ error: "User not found with that email address" });
        }
        
        const targetUser = userResult[0];
        
        if (targetUser.role === 'admin') {
            return res.status(400).json({ error: "User is already an admin" });
        }
        
        // Promote user to admin
        const updateResult = await sql`
            UPDATE users 
            SET role = 'admin'
            WHERE email = ${userEmail}
            RETURNING id, email, role
        `;
        
        const updatedUser = updateResult.rows?.[0] || updateResult[0];
        
        console.log('✅ User promoted to admin:', updatedUser);
        
        res.status(200).json({ 
            message: `User ${userEmail} has been promoted to admin`, 
            user: updatedUser
        });
        
    } catch (error) {
        console.error("❌ Error promoting user to admin:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
}

export async function getDefectiveItemsStats(req, res) {
    try {
        console.log('=== GET COMBINED DEFECTIVE ITEMS STATS ===');
        const { userId } = req.params;
        console.log('Fetching combined defective items stats for admin userId:', userId);
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${userId}`;
        const adminResult = adminCheck.rows || adminCheck;
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
            console.log('Access denied - not admin');
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }

        // Get all inspections - we'll filter the data processing instead of in SQL
        const inspections = await sql`
            SELECT id, defective_items, truck_trailer_items
            FROM vehicle_inspections 
            ORDER BY created_at DESC
        `;

        const inspectionResults = inspections.rows || inspections;
        console.log(`Found ${inspectionResults.length} total inspections`);

        // Separate counts for car items and truck/trailer items
        const carItemCounts = {};
        const truckTrailerItemCounts = {};
        let processedCarCount = 0;
        let processedTruckCount = 0;
        let errorCount = 0;
        
        inspectionResults.forEach((inspection, index) => {
            console.log(`\n--- Processing Inspection ${inspection.id} (${index + 1}/${inspectionResults.length}) ---`);
            
            // Process car defective items
            if (inspection.defective_items) {
                try {
                    let defectiveItems = null;
                    
                    console.log('Raw defective_items:', typeof inspection.defective_items, inspection.defective_items);
                    
                    // Handle different data types
                    if (typeof inspection.defective_items === 'string') {
                        const trimmed = inspection.defective_items.trim();
                        if (trimmed && trimmed !== '{}' && trimmed !== 'null' && trimmed !== 'undefined') {
                            defectiveItems = JSON.parse(trimmed);
                        }
                    } else if (typeof inspection.defective_items === 'object' && inspection.defective_items !== null) {
                        defectiveItems = inspection.defective_items;
                    }
                    
                    if (defectiveItems && typeof defectiveItems === 'object') {
                        console.log('Parsed defective_items:', defectiveItems);
                        let foundCarItems = false;
                        
                        Object.entries(defectiveItems).forEach(([itemKey, isSelected]) => {
                            console.log(`Car item: ${itemKey} = ${isSelected} (${typeof isSelected})`);
                            // Only count true values (not false)
                            if (isSelected === true || isSelected === 'true' || isSelected === 1) {
                                carItemCounts[itemKey] = (carItemCounts[itemKey] || 0) + 1;
                                foundCarItems = true;
                                console.log(`✅ Counted car item: ${itemKey}, total: ${carItemCounts[itemKey]}`);
                            }
                        });
                        
                        if (foundCarItems) processedCarCount++;
                    }
                } catch (error) {
                    console.error(`❌ Error parsing defective items for inspection ${inspection.id}:`, error.message);
                    errorCount++;
                }
            }

            // Process truck/trailer items
            if (inspection.truck_trailer_items) {
                try {
                    let truckTrailerItems = null;
                    
                    console.log('Raw truck_trailer_items:', typeof inspection.truck_trailer_items, inspection.truck_trailer_items);
                    
                    // Handle different data types
                    if (typeof inspection.truck_trailer_items === 'string') {
                        const trimmed = inspection.truck_trailer_items.trim();
                        if (trimmed && trimmed !== '{}' && trimmed !== 'null' && trimmed !== 'undefined') {
                            truckTrailerItems = JSON.parse(trimmed);
                        }
                    } else if (typeof inspection.truck_trailer_items === 'object' && inspection.truck_trailer_items !== null) {
                        truckTrailerItems = inspection.truck_trailer_items;
                    }
                    
                    if (truckTrailerItems && typeof truckTrailerItems === 'object') {
                        console.log('Parsed truck_trailer_items:', truckTrailerItems);
                        let foundTruckItems = false;
                        
                        Object.entries(truckTrailerItems).forEach(([itemKey, isSelected]) => {
                            console.log(`Truck item: ${itemKey} = ${isSelected} (${typeof isSelected})`);
                            // Only count true values (not false)
                            if (isSelected === true || isSelected === 'true' || isSelected === 1) {
                                // Don't add prefix, keep original item key
                                truckTrailerItemCounts[itemKey] = (truckTrailerItemCounts[itemKey] || 0) + 1;
                                foundTruckItems = true;
                                console.log(`✅ Counted truck item: ${itemKey}, total: ${truckTrailerItemCounts[itemKey]}`);
                            }
                        });
                        
                        if (foundTruckItems) processedTruckCount++;
                    }
                } catch (error) {
                    console.error(`❌ Error parsing truck trailer items for inspection ${inspection.id}:`, error.message);
                    errorCount++;
                }
            }
        });

        console.log(`\n=== PROCESSING SUMMARY ===`);
        console.log(`Processed ${processedCarCount} inspections with car defective items`);
        console.log(`Processed ${processedTruckCount} inspections with truck/trailer items`);
        console.log(`Errors: ${errorCount}`);
        console.log('Final car item counts:', carItemCounts);
        console.log('Final truck/trailer item counts:', truckTrailerItemCounts);

        // Convert car items to array format
        const carChartData = Object.entries(carItemCounts)
            .map(([itemKey, count]) => ({
                itemKey,
                count,
                type: 'car',
                label: itemKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }));

        // Convert truck/trailer items to array format
        const truckTrailerChartData = Object.entries(truckTrailerItemCounts)
            .map(([itemKey, count]) => ({
                itemKey,
                count,
                type: 'truck/trailer',
                label: itemKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            }));

        console.log('Car chart data:', carChartData);
        console.log('Truck/trailer chart data:', truckTrailerChartData);

        // Combine both arrays and sort by frequency
        const combinedChartData = [...carChartData, ...truckTrailerChartData]
            .filter(item => item.count > 0) // Only include items with actual counts
            .sort((a, b) => b.count - a.count); // Sort by frequency

        console.log(`\n=== FINAL RESULT ===`);
        console.log(`Returning ${combinedChartData.length} chart items:`);
        combinedChartData.forEach(item => {
            console.log(`- ${item.label} (${item.type}): ${item.count} occurrences`);
        });
        
        res.status(200).json(combinedChartData);
    } catch (error) {
        console.error("❌ Error getting combined defective items stats:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
}

export async function checkAdminStatus(req, res) {
    try {
        const { userId } = req.params;
        
        const result = await sql`
            SELECT role FROM users WHERE id = ${userId}
        `;
        
        const resultRows = result.rows || result;
        const isAdmin = resultRows[0]?.role === 'admin';
        res.status(200).json({ isAdmin });
    } catch (error) {
        console.error("Error checking admin status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getAllInspections(req, res) {
    try {
        const { userId } = req.params;
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${userId}`;
        const adminResult = adminCheck.rows || adminCheck;
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        const inspections = await sql`
            SELECT vi.*, u.email as user_email 
            FROM vehicle_inspections vi 
            LEFT JOIN users u ON vi.user_id = u.id 
            ORDER BY vi.created_at DESC
        `;
        
        const inspectionResults = inspections.rows || inspections;
        res.status(200).json(inspectionResults);
    } catch (error) {
        console.error("Error fetching all inspections:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function updateInspection(req, res) {
    try {
        console.log('=== ADMIN UPDATE INSPECTION REQUEST ===');
        console.log('Params:', req.params);
        console.log('Body:', req.body);
        
        const { id } = req.params;
        const { adminUserId, ...updateData } = req.body;
        
        if (!id || !adminUserId) {
            console.log('❌ Missing required parameters');
            return res.status(400).json({ error: "Missing inspection ID or admin user ID" });
        }
        
        // Verify admin status
        console.log('Checking admin status for user:', adminUserId);
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${adminUserId}`;
        const adminResult = adminCheck.rows || adminCheck;
        
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
            console.log('❌ Access denied - not admin');
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        console.log('✅ Admin verified, updating inspection:', id);
        console.log('Update data:', updateData);
        
        // First get the current inspection
        const currentInspection = await sql`
            SELECT * FROM vehicle_inspections WHERE id = ${id}
        `;
        
        const currentResult = currentInspection.rows || currentInspection;
        
        if (!currentResult || currentResult.length === 0) {
            console.log('❌ Inspection not found');
            return res.status(404).json({ error: "Inspection not found" });
        }
        
        const current = currentResult[0];
        console.log('Current inspection data:', current);
        
        // Update with new values or keep existing ones
        const result = await sql`
            UPDATE vehicle_inspections 
            SET 
                location = ${updateData.location !== undefined ? updateData.location : current.location},
                date = ${updateData.date !== undefined ? updateData.date : current.date},
                time = ${updateData.time !== undefined ? updateData.time : current.time},
                vehicle = ${updateData.vehicle !== undefined ? updateData.vehicle : current.vehicle},
                speedometer_reading = ${updateData.speedometer_reading !== undefined ? updateData.speedometer_reading : current.speedometer_reading},
                defective_items = ${updateData.defective_items !== undefined ? JSON.stringify(updateData.defective_items) : current.defective_items},
                truck_trailer_items = ${updateData.truck_trailer_items !== undefined ? JSON.stringify(updateData.truck_trailer_items) : current.truck_trailer_items},
                trailer_number = ${updateData.trailer_number !== undefined ? updateData.trailer_number : current.trailer_number},
                remarks = ${updateData.remarks !== undefined ? updateData.remarks : current.remarks},
                condition_satisfactory = ${updateData.condition_satisfactory !== undefined ? updateData.condition_satisfactory : current.condition_satisfactory},
                driver_signature = ${updateData.driver_signature !== undefined ? updateData.driver_signature : current.driver_signature},
                defects_corrected = ${updateData.defects_corrected !== undefined ? updateData.defects_corrected : current.defects_corrected},
                defects_need_correction = ${updateData.defects_need_correction !== undefined ? updateData.defects_need_correction : current.defects_need_correction},
                mechanic_signature = ${updateData.mechanic_signature !== undefined ? updateData.mechanic_signature : current.mechanic_signature}
            WHERE id = ${id}
            RETURNING *
        `;
        
        const updateResult = result.rows || result;
        console.log('Update result:', updateResult);
        console.log('✅ Inspection updated successfully');
        
        res.status(200).json({ 
            message: "Inspection updated successfully", 
            inspection: updateResult[0]
        });
        
    } catch (error) {
        console.error("❌ Error updating inspection:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
}

export async function adminDeleteInspection(req, res) {
    try {
        const { id } = req.params;
        const { adminUserId } = req.body;
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${adminUserId}`;
        const adminResult = adminCheck.rows || adminCheck;
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }

        const result = await sql`
            DELETE FROM vehicle_inspections WHERE id = ${id} RETURNING *
        `;

        const deleteResult = result.rows || result;
        if (!deleteResult || deleteResult.length === 0) {
            return res.status(404).json({ error: "Inspection not found" });
        }

        res.status(200).json({ message: "Inspection deleted successfully" });
    } catch (error) {
        console.error("Error deleting inspection:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}

export async function getInspectionStats(req, res) {
    try {
        const { userId } = req.params;
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${userId}`;
        const adminResult = adminCheck.rows || adminCheck;
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
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

        const statsResult = stats.rows || stats;
        res.status(200).json(statsResult[0]);
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
        const adminResult = adminCheck.rows || adminCheck;
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        const result = await sql`
            SELECT vi.*, u.email as user_email 
            FROM vehicle_inspections vi 
            LEFT JOIN users u ON vi.user_id = u.id 
            WHERE vi.id = ${id}
        `;
        
        const inspectionResult = result.rows || result;
        if (!inspectionResult || inspectionResult.length === 0) {
            return res.status(404).json({ error: "Inspection not found" });
        }
        
        res.status(200).json(inspectionResult[0]);
    } catch (error) {
        console.error("Error fetching single inspection:", error);
        res.status(500).json({ error: "Internal server error" });
    }
}