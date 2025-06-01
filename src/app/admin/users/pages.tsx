"use client";
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";

import { getAllDocuments } from "@/src/lib/firebase/firestore";
import { User, UserRole } from "@/src/models/user";
import Loading from "@/src/components/ui/loading";
import { get } from "http";
import { getRoleColor } from "@/src/lib/utils/styles";

export default function UsersList() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    const fetchUsers = async () => {
      try {
        const usersData = await getAllDocuments("users");

        setUsers(usersData as User[]);
        setIsLoading(false);
      } catch (error) {
        setError("Failed to load users. Please try again later.");
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  return (
    <div className="container mx-auto p-4">
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loading />
        </div>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : users.length > 0 ? (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Tickets</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className={getRoleColor(user.role)}>
                    {user.role}
                  </TableCell>
                  <TableCell className="text-center">0</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No users to display.</p>
        </div>
      )}
    </div>
  );
}
