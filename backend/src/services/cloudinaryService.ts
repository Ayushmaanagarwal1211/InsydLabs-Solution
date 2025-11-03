import { v2 as cloudinary } from "cloudinary";
import { UploadApiResponse } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "demo",
  api_key: process.env.CLOUDINARY_API_KEY || "demo",
  api_secret: process.env.CLOUDINARY_API_SECRET || "demo",
});

export class CloudinaryService {
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

  async deleteImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error("Cloudinary delete error:", error);
    }
  }

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
