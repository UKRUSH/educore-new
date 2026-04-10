import { v2 as cloudinary, type UploadApiOptions } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export function uploadBuffer(
  buffer: Buffer,
  options: UploadApiOptions,
): Promise<{ secure_url: string; public_id: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err || !result) return reject(err ?? new Error("Upload failed"))
      resolve({ secure_url: result.secure_url, public_id: result.public_id, bytes: result.bytes })
    })
    stream.end(buffer)
  })
}
