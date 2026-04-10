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

/**
 * Fetch a Cloudinary-hosted file as a Buffer.
 * If the direct CDN URL returns 401/403 (raw/PDF resources are access-restricted
 * by default), falls back to private_download_url which routes through
 * api.cloudinary.com with a signed request — always works with valid credentials.
 */
export async function fetchCloudinaryBuffer(fileUrl: string): Promise<Buffer> {
  // Try direct CDN fetch first (works for public image resources)
  const res = await fetch(fileUrl)
  if (res.ok) return Buffer.from(await res.arrayBuffer())

  if (res.status !== 401 && res.status !== 403)
    throw new Error(`Failed to fetch file from storage: ${res.status}`)

  // Parse: https://res.cloudinary.com/{cloud}/{resource_type}/upload/v{ver}/{public_id}.{ext}
  const match = fileUrl.match(
    /res\.cloudinary\.com\/[^/]+\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+?)(?:\.(\w+))?$/,
  )
  if (!match) throw new Error(`Cannot parse Cloudinary URL: ${fileUrl}`)

  const resourceType = match[1] as "image" | "raw" | "video"
  const publicId     = match[2]
  const format       = match[3] ?? ""

  const downloadUrl = cloudinary.utils.private_download_url(publicId, format, {
    resource_type: resourceType,
  })

  const authRes = await fetch(downloadUrl)
  if (!authRes.ok) throw new Error(`Cloudinary authenticated download failed: ${authRes.status}`)
  return Buffer.from(await authRes.arrayBuffer())
}
