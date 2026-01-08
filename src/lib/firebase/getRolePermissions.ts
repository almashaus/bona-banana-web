import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { RolePermissions } from "@/src/types/permissions";

export async function getRolePermissionsServer(): Promise<RolePermissions> {
  const snapshot = await db.collection("permissions").get();
  const permissionsObj: Partial<RolePermissions> = {};

  snapshot.forEach((doc) => {
    const docData = doc.data() as any;
    const roleKey = (docData.role ?? doc.id) as keyof RolePermissions;
    const perms = docData.permissions ?? docData;
    if (perms) permissionsObj[roleKey] = perms;
  });

  return permissionsObj as RolePermissions;
}
