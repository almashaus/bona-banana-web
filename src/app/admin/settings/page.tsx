"use client";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";
import { PanelLeft } from "lucide-react";
import React, { useState } from "react";

const SettingsPage = () => {
  // State for cities and roles
  const [cities, setCities] = useState<string[]>([
    "Riyadh",
    "Jeddah",
    "Makkah",
  ]);
  const [roles, setRoles] = useState<string[]>([
    "Admin",
    "Organizer",
    "Support",
    "Analyst",
    "Partner",
  ]);
  const [newCity, setNewCity] = useState("");
  const [newRole, setNewRole] = useState("");
  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);

  // Handlers
  const handleAddCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCity.trim() && !cities.includes(newCity.trim())) {
      setCities([...cities, newCity.trim()]);
      setNewCity("");
    }
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole.trim() && !roles.includes(newRole.trim())) {
      setRoles([...roles, newRole.trim()]);
      setNewRole("");
    }
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="flex justify-start items-center rounded-lg text-neutral-400 dark:text-white hover:bg-transparent"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <PanelLeft />
          </Button>
        )}
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {/* Cities Section */}
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">Events Cities</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCity} className="flex gap-2 mb-4">
              <Input
                type="text"
                className="border rounded px-3 py-2 flex-1"
                placeholder="Add new city"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
              />
              <Button type="submit">Add City</Button>
            </form>
            <ul className="list-disc pl-5 space-y-1">
              {cities.map((city, idx) => (
                <li key={idx} className="text-gray-700">
                  {city}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Roles Section */}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">
              Dashboard Roles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddRole} className="flex gap-2 mb-4">
              <Input
                type="text"
                className="border rounded px-3 py-2 flex-1"
                placeholder="Add new role"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
              />
              <Button type="submit">Add Role</Button>
            </form>
            <ul className="list-disc pl-5 space-y-1">
              {roles.map((role, idx) => (
                <li key={idx} className="text-gray-700 text-sm">
                  {role}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsPage;
