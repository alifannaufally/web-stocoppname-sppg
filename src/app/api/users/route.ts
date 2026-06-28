import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth";
import { createUserSchema, updateUserRoleSchema } from "@/lib/validators";

export async function GET() {
  await requirePermission("manage_users");

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      nama: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ data: users });
}

export async function POST(request: Request) {
  await requirePermission("manage_users");
  const supabase = await createClient();

  const body = await request.json();
  const parsed = createUserSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((e) => e.message).join(", ") },
      { status: 400 },
    );
  }

  const { email, nama, password, role } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 400 });
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return NextResponse.json(
      { error: authError?.message || "Gagal membuat akun" },
      { status: 500 },
    );
  }

  const dbUser = await prisma.user.create({
    data: {
      id: authData.user.id,
      email,
      nama,
      role,
    },
  });

  return NextResponse.json(
    {
      data: {
        id: dbUser.id,
        email: dbUser.email,
        nama: dbUser.nama,
        role: dbUser.role,
        createdAt: dbUser.createdAt,
      },
    },
    { status: 201 },
  );
}

export async function PATCH(request: Request) {
  await requirePermission("manage_users");
  const supabase = await createClient();

  const body = await request.json();
  const { id, nama, email, password, role } = body;

  if (!id) {
    return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
  }

  if (role) {
    const parsed = updateUserRoleSchema.safeParse({ role });
    if (!parsed.success) {
      return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
    }
  }

  const updateData: Record<string, unknown> = {};
  if (nama) updateData.nama = nama;
  if (email) updateData.email = email;
  if (role) updateData.role = role;

  if (password) {
    const { error: authError } = await supabase.auth.admin.updateUserById(id, {
      password,
    });
    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
  }

  const dbUser = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({
    data: {
      id: dbUser.id,
      email: dbUser.email,
      nama: dbUser.nama,
      role: dbUser.role,
    },
  });
}

export async function DELETE(request: Request) {
  const user = await requirePermission("manage_users");
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID diperlukan" }, { status: 400 });
  }

  if (id === user.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus diri sendiri" }, { status: 400 });
  }

  await supabase.auth.admin.deleteUser(id);
  await prisma.user.delete({ where: { id } });

  return NextResponse.json({ data: { success: true } });
}
