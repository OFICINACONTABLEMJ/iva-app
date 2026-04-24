import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

export async function POST(req: Request) {
  try {
    // 🔥 CONFIG REAL (NO HARDCODE)
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const data = await req.formData();
    const file = data.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 🔥 SUBIR A CLOUDINARY
    const upload = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "avatars" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    return NextResponse.json({
      url: upload.secure_url,
    });

  } catch (error) {
    console.error("UPLOAD ERROR:", error);
    return NextResponse.json({ error: "Error upload" }, { status: 500 });
  }
}