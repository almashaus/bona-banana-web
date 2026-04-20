"use client";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { getRoleColor } from "@/src/lib/utils/styles";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Switch } from "@/src/components/ui/switch";
import { MemberRole, RolePermissions } from "@/src/types/permissions";
import { useAuth } from "@/src/features/auth/auth-provider";
import Loading from "@/src/components/ui/loading";
import { getAuth } from "firebase/auth";
import isEqual from "lodash/isEqual";
import { useToast } from "@/src/components/ui/use-toast";
import { usePermissionStore } from "@/src/lib/stores/usePermissionStore";
import { mutate } from "swr";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Plus } from "lucide-react";

const PermissionsPage = () => {
  const { user } = useAuth();
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const { toast } = useToast();
  const setRolePermissions = usePermissionStore((s) => s.setRolePermissions);
  const [roles, setRoles] = useState<MemberRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<MemberRole>(roles[0]);
  const [editedPermissions, setEditedPermissions] =
    useState<RolePermissions | null>(null);
  const [saving, setSaving] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newFeatureName, setNewFeatureName] = useState("");
  const [newFeatureRoles, setNewFeatureRoles] = useState<
    Record<MemberRole, boolean>
  >(
    Object.fromEntries(
      Object.values(MemberRole).map((role) => [role, false]),
    ) as Record<MemberRole, boolean>,
  );
  const [creating, setCreating] = useState(false);

  const { data, isLoading, error } = useSWR<RolePermissions>(
    "/api/admin/permissions",
  );

  useEffect(() => {
    if (data && typeof data === "object") {
      const fetchedRoles = Object.keys(data) as MemberRole[];
      setRoles(fetchedRoles);
      setSelectedRole(selectedRole || fetchedRoles[0]);
      setEditedPermissions(data);
    }
  }, [data]);

  // Check if there are unsaved changes for the selected role
  const hasUnsavedChanges =
    !!editedPermissions &&
    !!data &&
    !!selectedRole &&
    !isEqual(editedPermissions[selectedRole], data[selectedRole]);

  // Handle toggle for a permission action
  const handlePermissionChange = (
    featureIdx: number,
    action: "view" | "create" | "edit" | "delete",
    value: boolean,
  ) => {
    if (!editedPermissions || !selectedRole) return;
    setEditedPermissions((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      updated[selectedRole] = updated[selectedRole].map((perm, idx) =>
        idx === featureIdx ? { ...perm, [action]: value } : perm,
      );
      return updated;
    });
  };

  const handleSavePermission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedPermissions || !selectedRole) return;
    setSaving(true);

    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch("/api/admin/permissions", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          role: selectedRole,
          data: {
            role: selectedRole,
            permissions: editedPermissions[selectedRole],
            updatedAt: new Date().toISOString(),
          },
        }),
      });

      if (!res.ok) throw new Error("Failed to save permissions");
      toast({
        title: "Permission Updated",
        description: "Permission has been updated successfully",
        variant: "success",
      });

      setRolePermissions(editedPermissions);

      mutate("/api/admin/permissions");
    } catch (err) {
      toast({
        title: "Error updating permission",
        description: "Failed to updated permission. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePermission = async () => {
    if (!newFeatureName.trim()) return;
    setCreating(true);
    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch("/api/admin/permissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          featureName: newFeatureName.trim(),
          roles: Object.entries(newFeatureRoles).map(([role, enabled]) => ({
            role,
            enabled,
          })),
        }),
      });

      if (!res.ok) throw new Error("Failed to create permission");
      toast({
        title: "Permission Created",
        description: `"${newFeatureName}" has been added successfully`,
        variant: "success",
      });

      setCreateDialogOpen(false);
      setNewFeatureName("");
      setNewFeatureRoles(
        Object.fromEntries(
          Object.values(MemberRole).map((role) => [role, false]),
        ) as Record<MemberRole, boolean>,
      );
      mutate("/api/admin/permissions");
    } catch (err) {
      toast({
        title: "Error creating permission",
        description: "Failed to create permission. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const hasSelectedRole = Object.values(newFeatureRoles).some(Boolean);

  if (user?.dashboard?.role !== MemberRole.ADMIN) {
    return (
      <div className="flex justify-center items-center h-2/3">
        <p className="text-muted-foreground">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">Members Permissions</h1>
          <p className="text-muted-foreground">
            Manage user permissions for different features
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create New Permission
            </Button>
          </DialogTrigger>
          <DialogContent dir="ltr">
            <DialogHeader>
              <DialogTitle>Create New Permission</DialogTitle>
              <DialogDescription>
                Add a new feature permission and assign it to roles.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <Label htmlFor="featureName">Feature Name</Label>
                <Input
                  id="featureName"
                  placeholder="e.g. Reports, Analytics, Settings..."
                  value={newFeatureName}
                  onChange={(e) => setNewFeatureName(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <Label>Assign to Roles</Label>
                <div className="space-y-3">
                  {Object.values(MemberRole).map((role) => (
                    <div
                      key={role}
                      className="flex items-center justify-between rounded-md border px-4 py-3"
                    >
                      <span className={`font-medium ${getRoleColor(role)}`}>
                        {role}
                      </span>
                      <Switch
                        checked={newFeatureRoles[role]}
                        onCheckedChange={(checked) =>
                          setNewFeatureRoles((prev) => ({
                            ...prev,
                            [role]: checked,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreatePermission}
                disabled={
                  creating || !newFeatureName.trim() || !hasSelectedRole
                }
              >
                {creating ? "Creating..." : "Save Permission"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Permissions Management</CardTitle>
          <CardDescription></CardDescription>
        </CardHeader>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loading />
          </div>
        ) : (
          <CardContent>
            <div className="">
              <h2 className="text-lg font-medium">Select a role</h2>
              <div className="max-w-lg mt-2 mb-6">
                <Select
                  value={String(selectedRole)}
                  onValueChange={(value: string) =>
                    setSelectedRole(value as MemberRole)
                  }
                >
                  <SelectTrigger
                    className={`w-full ${getRoleColor(selectedRole)}`}
                  >
                    <SelectValue placeholder="Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem
                        key={role}
                        value={String(role)}
                        className={`${getRoleColor(role)}`}
                      >
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead className="text-center">View</TableHead>
                      <TableHead className="text-center">Create</TableHead>
                      <TableHead className="text-center">Edit</TableHead>
                      <TableHead className="text-center">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editedPermissions &&
                      editedPermissions[selectedRole]?.map(
                        (permission, index) => (
                          <TableRow key={permission.feature}>
                            <TableCell className="font-medium">
                              {permission.feature}
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={permission.view}
                                onCheckedChange={(value) =>
                                  handlePermissionChange(index, "view", value)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={permission.create}
                                onCheckedChange={(value) =>
                                  handlePermissionChange(index, "create", value)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={permission.edit}
                                onCheckedChange={(value) =>
                                  handlePermissionChange(index, "edit", value)
                                }
                              />
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch
                                checked={permission.delete}
                                onCheckedChange={(value) =>
                                  handlePermissionChange(index, "delete", value)
                                }
                              />
                            </TableCell>
                          </TableRow>
                        ),
                      )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSavePermission}
                  disabled={saving || !hasUnsavedChanges}
                  variant={hasUnsavedChanges ? "default" : "secondary"}
                >
                  {saving ? "Saving..." : "Save Permissions"}
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default PermissionsPage;
