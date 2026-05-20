import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      centreId: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    centreId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    centreId: string;
  }
}
