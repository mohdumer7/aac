"use client";

import AuthComponent from "@/components/AuthComponent/AuthComponent";
import { AppSidebar } from "@/components/landingSideBar/app-sidebar";
import { Children, useState } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarFooter,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { redirect, usePathname } from "next/navigation";
import { NavUser } from "@/components/landingSideBar/nav-user";
import useUserAuthorised from "@/hooks/useUserAuthorised";
import NotificationPopover from "@/components/ui/NotificationPopover";



export default function Layout({ children }: { children: React.ReactNode }) {
  const [customLoadingState, setCustomLoadingState] = useState(false);
  const pathName = usePathname();
  const pathContent = pathName.split('/')
  const { user, menuItems, authenticated }: any = useUserAuthorised();
  if (!user || !authenticated) {
    return null; // or a loading spinner
    redirect('/'); // Redirect to home if user is not authenticated
  }
  return (
    <AuthComponent loadingState={customLoadingState}  >
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex flex-col w-full h-screen">
            <header className="flex h-12 shrink-0 items-center justify-between px-4">
              <div className="flex items-center gap-2 w-full">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">
                        Acero Application
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{pathContent[pathContent.length - 1].toProperCase()}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="w-full flex items-center justify-end gap-2 py-1">
                <SidebarFooter>
                  <NavUser user={user} />
                </SidebarFooter>
              </div>
              <div className="flex items-center gap-2">
                <NotificationPopover />
              </div>
            </header>
            <div className="h-full w-full overflow-auto">
              {children}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthComponent>
  );
}
