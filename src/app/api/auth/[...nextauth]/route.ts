// route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/configs/authOptions";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
