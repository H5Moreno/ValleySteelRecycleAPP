import { google } from 'googleapis';
import { Readable } from 'stream';

class GoogleDriveService {
    constructor() {
        this.auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_DRIVE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/drive.file'],
        });
        
        this.drive = google.drive({ version: 'v3', auth: this.auth });
        this.folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    }

    async uploadFile(fileBuffer, fileName, mimeType) {
        try {
            console.log(`🚀 Uploading ${fileName} to Google Drive...`);
            
            const fileMetadata = {
                name: fileName,
                parents: [this.folderId],
            };

            const media = {
                mimeType: mimeType,
                body: Readable.from(fileBuffer),
            };

            const response = await this.drive.files.create({
                resource: fileMetadata,
                media: media,
                fields: 'id, name, size, mimeType, webViewLink, webContentLink',
            });

            // Make the file publicly accessible
            await this.drive.permissions.create({
                fileId: response.data.id,
                resource: {
                    role: 'reader',
                    type: 'anyone',
                },
            });

            console.log(`✅ File uploaded successfully: ${response.data.id}`);
            
            return {
                fileId: response.data.id,
                fileName: response.data.name,
                fileSize: response.data.size,
                mimeType: response.data.mimeType,
                webViewLink: response.data.webViewLink,
                webContentLink: response.data.webContentLink,
                directLink: `https://drive.google.com/uc?id=${response.data.id}`,
            };
        } catch (error) {
            console.error('❌ Error uploading file to Google Drive:', error);
            throw new Error(`Google Drive upload failed: ${error.message}`);
        }
    }

    async deleteFile(fileId) {
        try {
            await this.drive.files.delete({ fileId: fileId });
            console.log(`🗑️ File deleted from Google Drive: ${fileId}`);
            return true;
        } catch (error) {
            console.error('❌ Error deleting file from Google Drive:', error);
            throw new Error(`Google Drive delete failed: ${error.message}`);
        }
    }

    async getFileInfo(fileId) {
        try {
            const response = await this.drive.files.get({
                fileId: fileId,
                fields: 'id, name, size, mimeType, webViewLink, webContentLink',
            });
            return response.data;
        } catch (error) {
            console.error('❌ Error getting file info from Google Drive:', error);
            throw new Error(`Google Drive get file failed: ${error.message}`);
        }
    }
}

export default new GoogleDriveService();
