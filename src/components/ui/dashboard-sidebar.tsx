"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { Button } from "./button";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";
import { Item, sidebarData } from "@/src/models/sidebarItem";
import { usePathname } from "next/navigation";

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = useIsMobile();
  const mobileOpen = useMobileSidebar((state) => state.mobileOpen);
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Handle sidebar open/close animation for mobile
  // Open: set showSidebar true immediately
  // Close: animate out, then hide after animation
  useEffect(() => {
    if (isMobile) {
      if (mobileOpen) {
        setShowSidebar(true);
        setIsAnimating(false);
      } else if (showSidebar) {
        setIsAnimating(true);
        const timeout = setTimeout(() => {
          setShowSidebar(false);
          setIsAnimating(false);
        }, 350);
        return () => clearTimeout(timeout);
      }
    } else {
      setShowSidebar(false);
      setIsAnimating(false);
    }
  }, [mobileOpen, isMobile, showSidebar]);

  // Sidebar content
  const sidebarContent = (
    <div className="h-full px-3 pb-4 pt-3 overflow-y-auto bg-neutral-300 dark:bg-gray-800 flex flex-col">
      <div className="space-y-2 text-sm">
        {sidebarData.map((item, idx) => (
          <SidebarItem
            key={idx}
            item={item}
            collapsed={collapsed && !isMobile}
          />
        ))}
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="flex items-center p-2 rounded-lg text-neutral-700 dark:text-white hover:text-white hover:bg-neutral-400 group mt-auto"
        onClick={() => {
          if (isMobile) setMobileOpen(false);
          else setCollapsed((prev) => !prev);
        }}
        aria-label={
          isMobile
            ? "Close sidebar"
            : collapsed
              ? "Expand sidebar"
              : "Collapse sidebar"
        }
      >
        {!collapsed || isMobile ? (
          <PanelLeftClose
            className="w-5 h-5 transition-transform duration-200"
            strokeWidth={1.5}
          />
        ) : (
          <PanelLeftOpen
            className="w-5 h-5 transition-transform duration-200"
            strokeWidth={1.5}
          />
        )}
      </Button>
    </div>
  );

  // Desktop:
  if (!isMobile) {
    return (
      <div
        className={`${
          collapsed ? "w-[64px]" : "w-[250px]"
        } min-h-screen transition-all duration-200`}
      >
        <aside
          className={`fixed top-0 left-0 z-40 ${
            collapsed ? "w-16" : "w-56"
          } h-screen pt-16 transition-all duration-200 bg-muted/50 sm:translate-x-0 dark:bg-gray-800 dark:border-gray-700`}
        >
          {sidebarContent}
        </aside>
      </div>
    );
  }

  // Mobile:
  return (
    <>
      {showSidebar && (
        <div className="fixed inset-0 z-50 bg-black/60 flex">
          <aside
            className={`relative w-56 h-full bg-neutral-300 dark:bg-gray-800 shadow-lg ${
              isAnimating ? "sidebar-slide-out" : "sidebar-slide-in"
            }`}
          >
            {sidebarContent}
          </aside>
          <div
            className="flex-1"
            onClick={() => setMobileOpen(false)}
            aria-label="Close sidebar overlay"
          />
        </div>
      )}
    </>
  );
}

export default function SidebarItem({
  item,
  collapsed = false,
}: {
  item: Item;
  collapsed?: boolean;
}) {
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);
  const pathname = usePathname();

  return (
    <Link
      href={item.url !== "..." ? item.url : ""}
      onClick={() => setMobileOpen(false)}
      className={`flex items-center p-2 text-neutral-700 rounded-lg dark:text-white ${pathname?.endsWith(item.url) && "text-white bg-neutral-400"} hover:text-white hover:bg-neutral-400 dark:hover:bg-gray-700 group transition-all duration-200 ${
        collapsed ? "justify-center" : ""
      }`}
    >
      <item.icon className="w-5 h-5" strokeWidth={1.5} />
      {!collapsed && (
        <>
          <span className="flex-1 ms-3">{item.title}</span>
          {/* [ Notifications number ] */}
          <span
            className={`${
              item.notifications ? "inline-flex" : "hidden"
            } items-center justify-center w-2 h-2 p-3 rounded-full text-xs text-neutral-50 bg-greenColor/30 dark:bg-orangeColor dark:text-white`}
          >
            {item.notifications}
          </span>
        </>
      )}
    </Link>
  );
}
