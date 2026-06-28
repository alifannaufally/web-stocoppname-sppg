import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import {
  getRolesAndPermissions,
  upsertRolePermission,
  bulkUpsertRolePermissions,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
} from "@/lib/db";
import { ALL_PERMISSIONS } from "@/lib/permissions";

function areValidPermissions(permissions: string[]): boolean {
  return permissions.every((p) => (ALL_PERMISSIONS as readonly string[]).includes(p));
}

export async function GET() {
  await requirePermission("manage_roles");

  try {
    const data = await getRolesAndPermissions();
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch roles" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  await requirePermission("manage_roles");

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Create custom role
  if (body.name && typeof body.name === "string") {
    const name = body.name.trim();
    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 });
    }
    try {
      const result = await createCustomRole(name, body.description as string | undefined);
      return NextResponse.json({ data: result }, { status: 201 });
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Failed to create role" },
        { status: 500 },
      );
    }
  }

  // Update permissions for a role
  const { role, permissions } = body as { role?: string; permissions?: string[] };
  if (!role || !permissions) {
    return NextResponse.json({ error: "name and description, or role and permissions are required" }, { status: 400 });
  }

  if (!Array.isArray(permissions) || !areValidPermissions(permissions)) {
    return NextResponse.json({ error: "permissions must be a valid array of permissions" }, { status: 400 });
  }

  try {
    const result = await upsertRolePermission(role, permissions);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update role permissions" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  await requirePermission("manage_roles");

  let body: { id?: string; name?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id, name, description } = body;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  try {
    const result = await updateCustomRole(id, { name, description });
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update role" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  await requirePermission("manage_roles");

  const { searchParams } = new URL(request.url);
  let id = searchParams.get("id");
  const name = searchParams.get("name");

  if (!id && !name) {
    return NextResponse.json({ error: "id or name query parameter is required" }, { status: 400 });
  }

  try {
    if (!id && name) {
      const { getCustomRoles } = await import("@/lib/db");
      const roles = await getCustomRoles();
      const found = roles.find((r: { id: string; name: string }) => r.name === name);
      if (!found) {
        return NextResponse.json({ error: "Custom role not found" }, { status: 404 });
      }
      id = found.id;
    }
    const result = await deleteCustomRole(id!);
    return NextResponse.json({ data: result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete role" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  await requirePermission("manage_roles");

  let body: { roles?: { role: string; permissions: string[] }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { roles } = body;

  if (!Array.isArray(roles) || roles.length === 0) {
    return NextResponse.json({ error: "roles array is required and must not be empty" }, { status: 400 });
  }

  for (const entry of roles) {
    if (!Array.isArray(entry.permissions) || !areValidPermissions(entry.permissions)) {
      return NextResponse.json(
        { error: `Invalid permissions for role "${entry.role}"` },
        { status: 400 },
      );
    }
  }

  try {
    const result = await bulkUpsertRolePermissions(roles);
    return NextResponse.json({ data: result }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to bulk update role permissions" },
      { status: 500 },
    );
  }
}
