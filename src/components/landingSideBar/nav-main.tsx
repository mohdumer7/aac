"use client"

import { ChevronRight, type LucideIcon } from "lucide-react"
import { GraduationCap, Box, BookUser, ScrollText, Ticket, PanelsTopLeft, AppWindow } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import Link from 'next/link';

const menuItems = [
  { icon: 'GraduationCap', Icon: GraduationCap },
  { icon: 'Box', Icon: Box },
  { icon: 'BookUser', Icon: BookUser },
  { icon: 'ScrollText', Icon: ScrollText },
  { icon: 'Ticket', Icon: Ticket },
  { icon: 'AppWindow', Icon: AppWindow },
  { icon: 'PanelsTopLeft', Icon: PanelsTopLeft },

];
const CreateSideBarItems = ({ item }: any) => {
  if (item.length === 0) return <></>;

  if (item.items.length === 0 && item.isActive) {

    const matchingItem = menuItems.find((menuItem) => menuItem?.icon === item?.icon);
    return (
      <SidebarMenuSubItem key={item.title}>
        <SidebarMenuSubButton asChild>
          <Link href={item.url} className="flex items-start flex-wrap max-w-[200px] gap-1">

            {matchingItem?.Icon && (
              <matchingItem.Icon className="h-4 w-4  font-normal" />
            )}
            <span className={`px-0.5  ${item?.category === 'menu' ? 'font-semibold' : 'pl-4'}`}>{item.title}</span>
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    )
  }



  if (item.isActive) {

    const matchingItem = menuItems.find((menuItem) => menuItem?.icon === item?.icon);

    return (
      <>
        <Collapsible key={item.title}>
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <button className="text-sm group flex items-center justify-between w-full px-2 py-1.5 text-left">
                <div className="flex items-center gap-2">
                  {matchingItem?.Icon && (
                    <matchingItem.Icon className="h-4 w-4  " />
                  )}
                  <span className={`px-0.5 text-sm font-semibold ${!matchingItem?.Icon && 'pl-4'}`}>{item.title}</span>
                </div>
                <ChevronRight
                  className="h-4 w-4 transition-transform duration-300 group-data-[state=open]:rotate-90"
                />

              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem: { title: any }) => (
                  <CreateSideBarItems key={subItem.title} item={subItem} />
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>



      </>
    )
  }
}

export function NavMain({
  items, label
}: {
  items: any[],
  label: string
}) {

  return (
    <SidebarGroup>
      {/* <SidebarGroupLabel>{label}</SidebarGroupLabel> */}
      <SidebarMenu>
        {items?.map((item, index) => (<CreateSideBarItems key={index} item={item} />))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

