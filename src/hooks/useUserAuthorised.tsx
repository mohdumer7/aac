"use client";

import { useSession } from "next-auth/react";

export default function useUserAuthorised() {
  const { data, status } = useSession();

  return {
    authenticated: status === "authenticated",
    user: data?.user,
    menuItems: data?.menuItems,
    status,
  };
}
