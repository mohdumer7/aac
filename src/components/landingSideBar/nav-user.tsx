"use client"

import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "lucide-react"
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Loader from "../ui/Loader";
import { usePathname } from "next/navigation";

export function NavUser({
  user,
}: {
  user: {
    displayName: string
    email: string
    avatar: string
  }
}) {

  const { isMobile } = useSidebar()
  const [customLoadingState, setCustomLoadingState] = useState(false);

 

  return (
    <Loader loading={customLoadingState}>
      <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarImage src={user?.avatar} alt={user?.displayName} />
                <AvatarFallback className="rounded-lg bg-slate-300">
                  {user?.displayName?.toProperCase()?.split(" ")[0][0] + (user?.displayName?.toProperCase()?.split(" ")[1]?.[0] || "")}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">{user?.displayName?.toProperCase()}</span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              {/* <ChevronsUpDown className="ml-auto size-4" /> */}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-md bg-white mt-3"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal bg-white">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm bg-white">
                <Avatar className="h-8 w-8 rounded-lg bg-slate-300">
                  <AvatarImage src={user?.avatar} alt={user?.displayName?.toProperCase()} />
                  <AvatarFallback className="rounded-lg bg-slate-300">
                  {user?.displayName?.toProperCase()?.split(" ")[0][0] + (user?.displayName?.toProperCase()?.split(" ")[1]?.[0] || "")}
                </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{user?.displayName?.toProperCase()}</span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
       
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
             
              <DropdownMenuItem>
                <Bell />
                Notifications
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
      </SidebarMenu>
    </Loader>
  )
}
