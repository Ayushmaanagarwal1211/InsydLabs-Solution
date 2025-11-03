import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";

// Configure Cloudinary (these should come from environment variables)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "demo",
  api_secret: process.env.CLOUDINARY_API_SECRET || "demo",
});

export class CloudinaryService {
  /**
   * Upload image to Cloudinary
   * @param filePath - Path to the file (from multer)
   * @param folder - Optional folder name in Cloudinary
   * @returns Promise with upload result containing secure_url
   */
  async uploadImage(
    filePath: string,
    folder: string = "payment-tracker"
  ): Promise<string> {
    try {
      const result: UploadApiResponse = await cloudinary.uploader.upload(
        filePath,
        {
          folder: folder,
          resource_type: "auto", // Automatically detect file type
          transformation: [
            { width: 800, height: 600, crop: "limit" }, // Limit max size
            { quality: "auto" }, // Auto optimize quality
            { format: "jpg" }, // Convert to JPG for consistency
          ],
        }
      );

      return result.secure_url; // Return the secure HTTPS URL
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload image to cloud storage");
    }
  }

  /**
   * Delete image from Cloudinary
   * @param publicId - The public ID of the image to delete
   */
  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      // Don't throw error for delete failures, just log them
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param imageUrl - Full Cloudinary URL
   * @returns Public ID for the image
   */
  extractPublicId(imageUrl: string): string {
    try {
      const parts = imageUrl.split("/");
      const lastPart = parts[parts.length - 1];
      return lastPart.split(".")[0]; // Remove file extension
    } catch (error) {
      return "";
    }
  }
}
