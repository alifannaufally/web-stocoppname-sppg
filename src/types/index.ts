import type { User } from "@prisma/client";

export type UserWithRole = Pick<User, "id" | "email" | "nama" | "role" | "createdAt">;
