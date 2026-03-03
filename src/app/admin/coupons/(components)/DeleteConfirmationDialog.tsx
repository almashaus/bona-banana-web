"use client";

import { Button } from "@/src/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Coupon } from "@/src/models/coupon";

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coupon: Coupon | null;
  onConfirmDelete: () => void;
  onDisableInstead: () => void;
  onClose: () => void;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  coupon,
  onConfirmDelete,
  onDisableInstead,
  onClose,
}: DeleteConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="ltr" className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Coupon</DialogTitle>
          <DialogDescription>
            {coupon && coupon.usageCount > 0
              ? `${coupon?.code ? `"${coupon.code}"` : "This Offer"} has been used ${coupon?.usageCount} time(s) and cannot be deleted. You may disable it instead.`
              : `Are you sure you want to permanently delete ${coupon?.code ? `"${coupon.code}"` : "this Offer"}? This action cannot be undone.`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {coupon && coupon.usageCount > 0 ? (
            <Button
              onClick={() => {
                onDisableInstead();
                onClose();
              }}
            >
              Disable Instead
            </Button>
          ) : (
            <Button variant="destructive" onClick={onConfirmDelete}>
              Delete Permanently
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
