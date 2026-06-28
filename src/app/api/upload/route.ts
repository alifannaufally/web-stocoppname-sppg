import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
const MAX_SIZE = 1048576; // 1MB

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File diperlukan" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Hanya file PNG, JPEG, JPG yang diizinkan" },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      {
        error: "File terlalu besar (maks 1MB)",
        redirectUrl: "https://www.iloveimg.com/id/kompres-gambar",
      },
      { status: 413 },
    );
  }

  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { data, error } = await supabase.storage
    .from("opname-images")
    .upload(fileName, file, { contentType: file.type, upsert: false });

  if (error) {
    return NextResponse.json({ error: `Gagal upload: ${error.message}` }, { status: 500 });
  }

  const { data: urlData } = supabase.storage.from("opname-images").getPublicUrl(fileName);

  return NextResponse.json({ data: { url: urlData.publicUrl, path: fileName } });
}
