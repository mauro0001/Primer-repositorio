import type { RolUsuario } from "@/lib/enums";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: RolUsuario;
      name?: string | null;
      email?: string | null;
    };
  }
  interface User {
    id: string;
    rol: RolUsuario;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: RolUsuario;
  }
}
