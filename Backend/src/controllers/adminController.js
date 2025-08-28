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

export async function bootstrapFirstAdmin(req, res) {
    try {
        const { userId, userEmail, secretKey } = req.body;
        
        console.log('🔐 BOOTSTRAP FIRST ADMIN ATTEMPT');
        console.log('User ID:', userId);
        console.log('Email:', userEmail);
        console.log('Received secret key:', secretKey);

        const BOOTSTRAP_SECRET = process.env.ADMIN_BOOTSTRAP_SECRET || "VSR_ADMIN_BOOTSTRAP_2024";
        console.log('Expected secret key:', BOOTSTRAP_SECRET);
        console.log('Environment variables loaded:', {
            PORT: process.env.PORT,
            ADMIN_BOOTSTRAP_SECRET: process.env.ADMIN_BOOTSTRAP_SECRET
        });
        
        if (secretKey !== BOOTSTRAP_SECRET) {
            console.log('❌ Secret key mismatch!');
            console.log('Received:', secretKey);
            console.log('Expected:', BOOTSTRAP_SECRET);
            return res.status(403).json({ error: "Invalid bootstrap secret" });
        }
        
        // Check if ANY admin already exists
        const existingAdmins = await sql`SELECT COUNT(*) as count FROM users WHERE role = 'admin'`;
        const adminCount = (existingAdmins.rows || existingAdmins)[0]?.count || 0;
        
        if (parseInt(adminCount) > 0) {
            console.log('❌ Admins already exist, bootstrap not allowed');
            return res.status(403).json({ 
                error: "Admin users already exist. Bootstrap is only allowed when no admins exist.",
                adminCount: adminCount
            });
        }
        
        console.log('✅ No admins exist, proceeding with bootstrap...');
        
        // Create the first admin user
        await sql`
            INSERT INTO users (id, email, role) 
            VALUES (${userId}, ${userEmail}, 'admin')
            ON CONFLICT (id) DO UPDATE SET 
                email = EXCLUDED.email,
                role = 'admin'
        `;
        
        // Also handle email conflicts
        await sql`
            INSERT INTO users (id, email, role) 
            VALUES (${userId}, ${userEmail}, 'admin')
            ON CONFLICT (email) DO UPDATE SET 
                id = EXCLUDED.id,
                role = 'admin'
        `;
        
        console.log('✅ First admin created successfully');
        
        res.status(200).json({ 
            message: "First admin created successfully",
            user: { id: userId, email: userEmail, role: 'admin' }
        });
        
    } catch (error) {
        console.error("❌ Error bootstrapping first admin:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
}

// Enhanced promote function that works for any user
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
        
        // Verify the requester has admin privileges
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${adminUserId}`;
        const adminResult = adminCheck.rows || adminCheck;
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        // Try to find the user by email (case insensitive)
        let userCheck = await sql`
            SELECT id, email, role FROM users 
            WHERE LOWER(email) = LOWER(${userEmail})
        `;
        let userResult = userCheck.rows || userCheck;
        
        // If user doesn't exist, create them with admin role using a special placeholder ID
        if (!userResult || userResult.length === 0) {
            console.log('📝 User not found, creating new admin user...');
            console.log('📧 Email to process:', userEmail);
            
            // Create user with email as primary identifier
            // Use email-based ID that will be updated when they first log in
            // Improved sanitization for all email domains
            const emailBasedId = `email_${userEmail
                .toLowerCase()
                .replace(/[^a-zA-Z0-9@._-]/g, '_')
                .replace(/@/g, '_at_')
                .replace(/\./g, '_dot_')
                .substring(0, 200)}`; // Ensure ID doesn't exceed VARCHAR(255) limit
            
            console.log('🆔 Generated email-based ID:', emailBasedId);
            
            try {
                const insertResult = await sql`
                    INSERT INTO users (id, email, role) 
                    VALUES (${emailBasedId}, ${userEmail}, 'admin')
                    RETURNING id, email, role
                `;
                
                const newUser = insertResult.rows?.[0] || insertResult[0];
                console.log('✅ New admin user created:', newUser);
                
                res.status(200).json({ 
                    message: `New admin user created for ${userEmail}. They will have admin access when they first log in.`,
                    user: newUser,
                    isNewUser: true
                });
                return;
            } catch (insertError) {
                console.error('❌ Error creating new admin user:', insertError);
                
                // Check if it's a duplicate email error
                if (insertError.message && insertError.message.includes('duplicate') || insertError.code === '23505') {
                    return res.status(400).json({ 
                        error: `A user with email ${userEmail} already exists. Please check if they are already registered.` 
                    });
                }
                
                return res.status(500).json({ 
                    error: `Failed to create admin user: ${insertError.message}` 
                });
            }
        }
        
        const targetUser = userResult[0];
        console.log('👤 Existing user found:', targetUser);
        console.log('📧 Current role:', targetUser.role);
        
        if (targetUser.role === 'admin') {
            return res.status(200).json({ 
                message: `${userEmail} is already an admin.`,
                user: targetUser,
                isAlreadyAdmin: true
            });
        }
        
        // Promote existing user to admin
        try {
            console.log('🔄 Promoting user to admin...');
            const updateResult = await sql`
                UPDATE users 
                SET role = 'admin'
                WHERE id = ${targetUser.id}
                RETURNING id, email, role
            `;
            
            const updatedUser = updateResult.rows?.[0] || updateResult[0];
            
            if (!updatedUser) {
                console.error('❌ Update query succeeded but no user returned');
                return res.status(500).json({ error: "Failed to update user role - no user returned" });
            }
            
            console.log('✅ User promoted to admin:', updatedUser);
            
            res.status(200).json({ 
                message: `User ${userEmail} has been promoted to admin`,
                user: updatedUser,
                isNewUser: false,
                isPromotion: true
            });
        } catch (updateError) {
            console.error('❌ Error during user role update:', updateError);
            return res.status(500).json({ 
                error: `Failed to promote user: ${updateError.message}` 
            });
        }
        
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

        // Use a single query to check both admin count and user status
        const result = await sql`
            SELECT 
                (SELECT COUNT(*) FROM users WHERE role = 'admin') as admin_count,
                (SELECT role FROM users WHERE id = ${userId || null}) as user_role
        `;
        
        const { admin_count, user_role } = (result.rows || result)[0];
        const adminCount = parseInt(admin_count, 10);
        
        // If no admins exist, trigger bootstrap
        if (adminCount === 0) {
            console.log('No admins found in the system. Triggering bootstrap.');
            return res.status(200).json({ isAdmin: false, needsBootstrap: true });
        }
        
        // Check if current user is admin
        const isAdmin = user_role === 'admin';
        return res.status(200).json({ isAdmin, needsBootstrap: false });

    } catch (error) {
        console.error("Error in checkAdminStatus:", error);
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
        
        // Handle photo updates if provided
        if (updateData.photos !== undefined && Array.isArray(updateData.photos)) {
            console.log('📸 Updating photos for inspection:', id);
            console.log('📸 Photos received:', updateData.photos);
            
            // Don't delete existing photos, just ensure new ones are stored
            // This prevents photo loss when editing other fields
            
            // Process each photo to ensure proper storage
            for (const photo of updateData.photos) {
                console.log('📸 Processing photo:', photo);
                
                // Check if this photo already exists in database (has id or cloudinary_public_id)
                let existingPhoto = null;
                if (photo.id || photo.cloudinary_public_id) {
                    try {
                        const existingResult = await sql`
                            SELECT id FROM inspection_images 
                            WHERE inspection_id = ${id} 
                            AND (id = ${photo.id || null} OR cloudinary_public_id = ${photo.cloudinary_public_id || null})
                        `;
                        existingPhoto = (existingResult.rows || existingResult)[0];
                    } catch (checkError) {
                        console.log('📸 Error checking existing photo:', checkError);
                    }
                }
                
                // Only insert if it's a new photo (has cloudinary data but not in database)
                if (!existingPhoto && (photo.cloudinary_url || photo.uri) && (photo.cloudinary_public_id || photo.name)) {
                    try {
                        console.log('📸 Inserting new photo metadata:', photo.name || photo.file_name);
                        await sql`
                            INSERT INTO inspection_images (
                                inspection_id, 
                                cloudinary_url, 
                                cloudinary_public_id,
                                file_name,
                                width, 
                                height, 
                                file_size,
                                image_type,
                                created_at,
                                uploaded_by,
                                is_private,
                                resource_type,
                                format,
                                vehicle_id,
                                vehicle_folder,
                                context_metadata
                            ) VALUES (
                                ${id}, 
                                ${photo.cloudinary_url || photo.uri}, 
                                ${photo.cloudinary_public_id || null},
                                ${photo.name || photo.file_name || `photo_${Date.now()}`},
                                ${photo.width || null}, 
                                ${photo.height || null}, 
                                ${photo.fileSize || photo.file_size || null},
                                'defect_photo',
                                ${photo.created_at || photo.uploaded_at || new Date()},
                                ${photo.uploaded_by || updateData.adminUserId || adminUserId},
                                ${photo.is_private !== undefined ? photo.is_private : true},
                                ${photo.resource_type || photo.resourceType || 'image'},
                                ${photo.format || 'jpg'},
                                ${photo.vehicle_id || photo.vehicle || current.vehicle},
                                ${photo.vehicle_folder || photo.vehicleFolder || null},
                                ${JSON.stringify(photo.context_metadata || photo.context || {})}
                            )
                        `;
                        console.log('✅ New photo metadata stored:', photo.name || photo.file_name);
                    } catch (photoError) {
                        console.error('❌ Error storing photo metadata:', photoError);
                        // Don't fail the entire update for photo errors, just log
                    }
                } else {
                    console.log('📸 Photo already exists or missing required data, skipping:', photo.name || photo.file_name);
                }
            }
            
            console.log(`📸 Photo processing complete for inspection ${id}`);
        }
        
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

export async function updateUserEmailsFromClerk(req, res) {
    try {
        const { adminUserId, userUpdates } = req.body;
        
        console.log('=== UPDATE USER EMAILS FROM CLERK ===');
        console.log('Admin user:', adminUserId);
        console.log('User updates:', userUpdates);
        
        if (!adminUserId || !Array.isArray(userUpdates)) {
            return res.status(400).json({ error: "Missing admin user ID or user updates array" });
        }
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${adminUserId}`;
        const adminResult = adminCheck.rows || adminCheck;
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        let updatedCount = 0;
        const errors = [];
        
        // Update each user's email
        for (const update of userUpdates) {
            const { userId, newEmail } = update;
            if (!userId || !newEmail) {
                errors.push(`Invalid update data: ${JSON.stringify(update)}`);
                continue;
            }
            
            try {
                const result = await sql`
                    UPDATE users 
                    SET email = ${newEmail}
                    WHERE id = ${userId} AND email LIKE '%@clerk.user'
                    RETURNING id, email
                `;
                
                const updateResult = result.rows || result;
                if (updateResult && updateResult.length > 0) {
                    updatedCount++;
                    console.log(`✅ Updated user ${userId} email to: ${newEmail}`);
                } else {
                    console.log(`⚠️ No update for user ${userId} (email not fake or user not found)`);
                }
            } catch (error) {
                errors.push(`Failed to update user ${userId}: ${error.message}`);
                console.error(`❌ Error updating user ${userId}:`, error);
            }
        }
        
        res.status(200).json({ 
            message: `Successfully updated ${updatedCount} user emails`,
            updatedCount,
            errors: errors.length > 0 ? errors : null
        });
        
    } catch (error) {
        console.error("❌ Error updating user emails:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
    }
}

export async function fixDuplicateUsers(req, res) {
    try {
        const { adminUserId } = req.body;
        
        console.log('=== FIX DUPLICATE USERS ===');
        console.log('Admin user:', adminUserId);
        
        if (!adminUserId) {
            return res.status(400).json({ error: "Missing admin user ID" });
        }
        
        // Verify admin status
        const adminCheck = await sql`SELECT role FROM users WHERE id = ${adminUserId}`;
        const adminResult = adminCheck.rows || adminCheck;
        if (!adminResult || adminResult.length === 0 || adminResult[0]?.role !== 'admin') {
            return res.status(403).json({ error: "Access denied. Admin privileges required." });
        }
        
        // Find duplicate users by email (where one is email-based ID and another is Clerk ID)
        const duplicates = await sql`
            SELECT email, array_agg(id) as user_ids, array_agg(role) as roles
            FROM users 
            WHERE email NOT LIKE '%@clerk.user'
            GROUP BY email 
            HAVING COUNT(*) > 1
        `;
        
        const duplicateResults = duplicates.rows || duplicates;
        let fixedCount = 0;
        const errors = [];
        
        for (const duplicate of duplicateResults) {
            const { email, user_ids, roles } = duplicate;
            
            try {
                // Find which ID is the Clerk ID (starts with 'user_') and which is email-based
                const clerkId = user_ids.find(id => id.startsWith('user_'));
                const emailBasedId = user_ids.find(id => id.startsWith('email_'));
                
                if (clerkId && emailBasedId) {
                    console.log(`🔧 Fixing duplicate for ${email}: merging ${emailBasedId} into ${clerkId}`);
                    
                    // Get the role from the email-based user (likely admin)
                    const emailUserIndex = user_ids.indexOf(emailBasedId);
                    const emailUserRole = roles[emailUserIndex];
                    
                    // Update the Clerk user with the role from the email-based user
                    await sql`
                        UPDATE users 
                        SET role = ${emailUserRole}
                        WHERE id = ${clerkId}
                    `;
                    
                    // Transfer any inspections from email-based ID to Clerk ID
                    await sql`
                        UPDATE vehicle_inspections 
                        SET user_id = ${clerkId}
                        WHERE user_id = ${emailBasedId}
                    `;
                    
                    // Delete the email-based user record
                    await sql`
                        DELETE FROM users 
                        WHERE id = ${emailBasedId}
                    `;
                    
                    fixedCount++;
                    console.log(`✅ Fixed duplicate for ${email}`);
                }
            } catch (error) {
                errors.push(`Failed to fix duplicate for ${email}: ${error.message}`);
                console.error(`❌ Error fixing duplicate for ${email}:`, error);
            }
        }
        
        res.status(200).json({ 
            message: `Successfully fixed ${fixedCount} duplicate users`,
            fixedCount,
            errors: errors.length > 0 ? errors : null
        });
        
    } catch (error) {
        console.error("❌ Error fixing duplicate users:", error);
        res.status(500).json({ error: "Internal server error: " + error.message });
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