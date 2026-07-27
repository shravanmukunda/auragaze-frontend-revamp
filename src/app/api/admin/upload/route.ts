import { requireAdmin } from "@/lib/admin-auth";
import { uploadProductImage, validateImageFile } from "@/lib/cloudinary";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json(
      { error: "Choose an image file to upload." },
      { status: 400 },
    );
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  try {
    const uploaded = await uploadProductImage(file);
    return NextResponse.json({
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
      width: uploaded.width,
      height: uploaded.height,
    });
  } catch (error) {
    console.error("Failed to upload image to Cloudinary", error);
    const message =
      error instanceof Error && error.message.includes("not configured")
        ? error.message
        : "Unable to upload image.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
