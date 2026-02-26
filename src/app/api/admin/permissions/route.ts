import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import { verifyIdToken } from "@/src/lib/firebase/verifyIdToken";
import { NextRequest, NextResponse } from "next/server";
import { FeaturePermission, RolePermissions } from "@/src/types/permissions";
import { FieldValue } from "firebase-admin/firestore";

export async function GET() {
  try {
    const snapshot = await db.collection("permissions").get();

    const permissionsObj: Partial<RolePermissions> = {};

    snapshot.forEach((doc) => {
      const docData = doc.data() as any;
      const roleKey = (docData.role ?? doc.id) as keyof RolePermissions;
      const perms = docData.permissions ?? docData;
      if (perms) {
        permissionsObj[roleKey] = perms;
      }
    });

    return NextResponse.json(permissionsObj as RolePermissions, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return NextResponse.json(
      { data: "Error" },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json(
        { data: "Unauthorized" },
        { status: 401, headers: { "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { featureName, roles } = body as {
      featureName: string;
      roles: { role: string; enabled: boolean }[];
    };

    if (!featureName || !roles?.length) {
      return NextResponse.json(
        { error: "Missing featureName or roles" },
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const batch = db.batch();

    for (const { role, enabled } of roles) {
      if (!enabled) continue;
      const newPermission: FeaturePermission = {
        feature: featureName,
        view: false,
        create: false,
        edit: false,
        delete: false,
      };
      const docRef = db.collection("permissions").doc(role);
      batch.update(docRef, {
        permissions: FieldValue.arrayUnion(newPermission),
      });
    }

    await batch.commit();

    return NextResponse.json(
      { success: true },
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error creating permission" },
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authHeader = req.headers.get("Authorization") || "";

    const decodedToken = await verifyIdToken(authHeader);

    if (!decodedToken || !decodedToken.admin) {
      return NextResponse.json(
        { data: "Unauthorized" },
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const { data, role } = body;

    await db.collection("permissions").doc(role).update(data);

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Error" },
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
