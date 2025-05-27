import { EventStatus } from "@/src/models/event";
import { Clock4Icon, EyeIcon, XIcon, CheckIcon } from "lucide-react";

export const getStatusIcon = (status: string) => {
  switch (status) {
    case EventStatus.DRAFT:
      return <Clock4Icon className=" w-4 h-4 text-gray-400 mx-1 " />;
    case EventStatus.PUBLISHED:
      return <EyeIcon className=" w-4 h-4 text-blue-400 mx-1 " />;
    case EventStatus.CANCELLED:
      return <XIcon className=" w-4 h-4 text-red-400 mx-1 " />;
    case EventStatus.COMPLETED:
      return <CheckIcon className=" w-4 h-4 text-green-400 mx-1 " />;
    default:
      return <CheckIcon className=" w-4 h-4 text-green-400 mx-1 " />;
  }
};
