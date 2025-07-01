// authOptions.ts
import NextAuth, { AuthOptions, Session } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import CredentialsProvider from "next-auth/providers/credentials";
import { dbConnect } from "@/lib/mongoose";
import { Access, User } from "@/models";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

declare module "next-auth" {
  interface Session {
    menuItems?: any;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || "",
      clientSecret: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_SECRET || "",
      tenantId: process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID || "",
      authorization: {
        params: { scope: "openid profile email" },
      },
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const { email, password } = credentials as { email: string; password: string };
        await dbConnect();
        const user = await User.findOne({ email });
        const isPasswordValid = await bcrypt.compare(password, user?.password || "");
        console.log("DB User:", user, "Email:", email,isPasswordValid ? "Password valid" : "Password invalid");
        if (!user || !isPasswordValid) return null;
        return user as any;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      await dbConnect();
      const email = user.email;
      const dbUser = await User.findOne({ email });
      console.log("DB User:", dbUser, "Email:", email);
      if (!dbUser) return false;
      return true;
    },
    async session({ session }) {
      await dbConnect();
      if (!session.user) {
        console.error("Session user is undefined");
        return session;
      }
      const user = await User.findOne({ email: session.user.email });
      if (!user) {
        console.error("User not found");
        return session;
      }
      session.user = user;
      const accessIdsUnfiltered = Array.isArray(user.access) ? user.access.map((data: { accessId: any }) => data.accessId) : [];
      const accessIds = accessIdsUnfiltered.filter((id: any) => id);
      const accessMap = new Map(
        (Array.isArray(user.access) ? user.access : [])
          .filter((data: { permissions: any }) => data.permissions.view)
          .map((data: { accessId: any; permissions: any }) => [
            data.accessId?._id?.toString(),
            { permissions: data.permissions },
          ])
      );
      const trees = await Access.aggregate([
        {
          $match: {
            _id: { $in: accessIds.map((id) => new mongoose.Types.ObjectId(id)) },
          },
        },
        {
          $graphLookup: {
            from: "accesses",
            startWith: "$parent",
            connectFromField: "parent",
            connectToField: "_id",
            as: "ancestors",
          },
        },
        { $sort: { order: 1 } },
      ]);
      const allAncestors = trees.flatMap((tree) => [...tree.ancestors, tree]);
      // console.log("All Ancestors:", allAncestors);
      const uniqueAncestors = Array.from(
        new Map(allAncestors.map((ancestor) => [ancestor._id.toString(), ancestor])).values()
      );
     
      const menuItems = buildNavStructure(
        uniqueAncestors.map((ancestor) => ({
          ...ancestor,
          _id: ancestor?._id?.toString(),
          parent: ancestor.parent ? ancestor?.parent?.toString() : null,
          icon: ancestor?.icon
        })),
        accessMap
      );
      
      session.menuItems = menuItems;
      return session;
    },
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/error",
  },
};

function buildNavStructure(ancestors: any[], accessMap: Map<string, any>) {
  if (!ancestors || ancestors.length === 0) return null;
  const nodeMap = new Map();
  ancestors.forEach((ancestor) => {
    const nodeId = ancestor?._id?.toString();
    const permissions = accessMap.get(nodeId)?.permissions || {};
    if (!nodeMap.has(nodeId)) {
      nodeMap.set(nodeId, {
        title: ancestor.name,
        url: ancestor.url || "#",
        category: ancestor.category,
        icon: ancestor?.icon,
        isActive: ancestor.isActive || false,
        permissions,
        items: [],
      });
    }
  });
  ancestors.forEach((ancestor) => {
    const currentNode = nodeMap.get(ancestor._id.toString());
    if (ancestor.parent) {
      const parentNode = nodeMap.get(ancestor.parent.toString());
      if (parentNode) parentNode.items.push(currentNode);
    }
  });
  const rootNodes = ancestors.filter((ancestor) => !ancestor.parent);
  return rootNodes.map((root) => nodeMap.get(root._id.toString()));
}
