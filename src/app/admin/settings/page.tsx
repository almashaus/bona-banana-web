"use client";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { useAuth } from "@/src/features/auth/auth-provider";
import { getRoleBadgeColor } from "@/src/lib/utils/styles";
import { MemberRole } from "@/src/types/permissions";
import { Image, MapPin, MonitorCog, UploadIcon } from "lucide-react";
import React, { useState } from "react";
import useSWR, { mutate } from "swr";
import ImagesGallery from "./imagesGallery";

const SettingsPage = () => {
  const { user } = useAuth();
  interface CityResponse {
    city: {
      ar: string;
      en: string;
    }[];
  }

  const { data: cities } = useSWR<CityResponse>("/api/admin/settings/city");

  const [roles, setRoles] = useState<string[]>([
    "Admin",
    "Organizer",
    "Support",
    "Finance",
    "Partner",
  ]);
  const [newCityEn, setNewCityEn] = useState("");
  const [newCityAr, setNewCityAr] = useState("");
  const [newCityIsAdding, setnewCityIsAdding] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [imagesAreSaving, setImagesAreSaving] = useState(false);

  // Handlers
  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    setnewCityIsAdding(true);
    if (
      newCityEn &&
      !cities?.city.some(
        (cityObj) =>
          cityObj.en.toLowerCase() === newCityEn.toLowerCase() ||
          cityObj.ar === newCityAr
      )
    ) {
      const response = await fetch("/api/admin/settings/city", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ data: { en: newCityEn, ar: newCityAr } }),
      });

      if (response.ok) {
        await mutate("/api/admin/settings/city");
        setNewCityEn("");
        setNewCityAr("");
      }
    }
    setnewCityIsAdding(false);
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (newRole.trim() && !roles.includes(newRole.trim())) {
      setRoles([...roles, newRole.trim()]);
      setNewRole("");
    }
  };

  const handleSaveImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    setImagesAreSaving(true);

    setImagesAreSaving(false);
  };

  return (
    <div className="p-4 md:p-6 flex flex-col gap-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Cities Section */}
        <div className="space-y-3 max-w-[500px]">
          <h2 className="text-xl font-bold">Event Settings</h2>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="flex space-y-0 pb-2">
                <CardTitle className="flex justify-center items-center text-lg font-medium">
                  <MapPin className="h-5 w-5 me-1 text-redColor" />
                  Event Cities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <form onSubmit={handleAddCity} className="flex flex-col gap-2">
                  <Label className="text-md">Add New City</Label>
                  <Input
                    type="text"
                    className="border rounded px-3 py-2 flex-1"
                    placeholder="City Name (English)"
                    value={newCityEn}
                    onChange={(e) => setNewCityEn(e.target.value)}
                  />
                  <Input
                    type="text"
                    className="border rounded px-3 py-2 flex-1 text-right"
                    placeholder="اسم المدينة (عربي)"
                    value={newCityAr}
                    onChange={(e) => setNewCityAr(e.target.value)}
                    disabled={newCityIsAdding}
                  />
                  <Button type="submit">
                    {newCityIsAdding ? <>...</> : <>Add City</>}
                  </Button>
                </form>
                <div>
                  {cities?.city.map((city, idx) => (
                    <Badge
                      key={idx}
                      className="text-gray-700 bg-neutral-200 px-3 py-1 me-2 mb-2"
                    >
                      {city.en} {city.ar}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-3 max-w-[500px]">
          <h2 className="text-xl font-bold">Members Settings</h2>

          <div className="flex flex-col gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row justify-center items-center space-y-0 pb-2">
                <CardTitle className="flex justify-center items-center me-1 text-lg font-medium">
                  <MonitorCog className="h-5 w-5 me-2 text-redColor" />{" "}
                  Dashboard Roles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                <form onSubmit={handleAddRole} className="flex gap-2 my-4">
                  <Input
                    type="text"
                    className="border rounded px-3 py-2 flex-1"
                    placeholder="Add new role"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                  <Button type="submit">Add Role</Button>
                </form>
                <div>
                  {roles.map((role, idx) => (
                    <Badge
                      key={idx}
                      className={`${getRoleBadgeColor(role)} px-3 py-1 me-2 mb-2`}
                    >
                      {role}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      {user?.dashboard?.role === MemberRole.ADMIN && (
        <div className="space-y-6">
          <Separator />

          <ImagesGallery />
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
