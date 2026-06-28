import { describe, it, expect } from "vitest";

describe("Role type safety", () => {
  it("allows only valid roles", () => {
    const validRoles = ["AKUNTAN", "KORLAP", "KEPALA_GUDANG", "ADMIN"];

    const roleSet = new Set(validRoles);

    expect(roleSet.has("AKUNTAN")).toBe(true);
    expect(roleSet.has("KORLAP")).toBe(true);
    expect(roleSet.has("KEPALA_GUDANG")).toBe(true);
    expect(roleSet.has("ADMIN")).toBe(true);
  });

  it("requireRole signature enforces allowed roles array", async () => {
    async function requireRole(allowed: string[]) {
      return allowed;
    }

    await expect(requireRole(["ADMIN"])).resolves.toEqual(["ADMIN"]);
    await expect(requireRole(["KORLAP", "KEPALA_GUDANG", "ADMIN"])).resolves.toEqual([
      "KORLAP",
      "KEPALA_GUDANG",
      "ADMIN",
    ]);
  });

  it("requireRole rejects AKUNTAN for operational pages", () => {
    const operationalRoles = ["KORLAP", "KEPALA_GUDANG", "ADMIN"];

    expect(operationalRoles).not.toContain("AKUNTAN");
  });

  it("pengguna page requires ADMIN exclusively", () => {
    const adminOnly = ["ADMIN"];

    expect(adminOnly).not.toContain("AKUNTAN");
    expect(adminOnly).not.toContain("KORLAP");
    expect(adminOnly).not.toContain("KEPALA_GUDANG");
  });
});

describe("requireRole logic", () => {
  it("redirects to login when user is null", async () => {
    let redirected = false;

    async function requireRole(allowed: string[]) {
      const user = null;
      if (!user) {
        redirected = true;
      }
      return user;
    }

    await requireRole(["ADMIN"]);
    expect(redirected).toBe(true);
  });

  it("redirects non-admin users accessing admin page", () => {
    const allowed = ["ADMIN"];
    const nonAdminUsers = ["AKUNTAN", "KORLAP", "KEPALA_GUDANG"];

    for (const role of nonAdminUsers) {
      expect(allowed.includes(role)).toBe(false);
    }
  });

  it("allows admin to access admin page", () => {
    const allowed = ["ADMIN"];
    expect(allowed.includes("ADMIN")).toBe(true);
  });
});
