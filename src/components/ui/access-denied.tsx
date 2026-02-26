import { LockIcon } from "lucide-react";

export default function AccessDenied() {
  return (
    <div className="flex flex-col justify-center items-center h-2/3">
      <LockIcon className="h-4 w-4 text-muted-foreground" />
      <p className="text-muted-foreground">Access Denied</p>
    </div>
  );
}
