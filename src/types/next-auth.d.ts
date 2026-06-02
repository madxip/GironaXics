import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      centreId: string;
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    centreId: string;
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    centreId: string;
    isAdmin: boolean;
  }
}
