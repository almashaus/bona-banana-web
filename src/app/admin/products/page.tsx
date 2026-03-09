"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  Archive,
  CheckIcon,
  ChevronLeft,
  ChevronRight,
  CircleAlertIcon,
  Clock4Icon,
  EyeIcon,
  EyeOff,
  ImageIcon,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  UploadIcon,
  X,
  XIcon,
  Package,
  FileText,
  RefreshCcw,
  FolderPlus,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { Badge } from "@/src/components/ui/badge";
import { Progress } from "@/src/components/ui/progress";
import { useToast } from "@/src/components/ui/use-toast";
import Loading from "@/src/components/ui/loading";
import LoadingDots from "@/src/components/ui/loading-dots";
import { useAuthStore } from "@/src/lib/stores/useAuthStore";
import { usePermissions } from "@/src/hooks/useMemberPermissions";
import AccessDenied from "@/src/components/ui/access-denied";
import {
  DigitalProduct,
  ProductCategory,
  DigitalProductStatus,
} from "@/src/models/digitalProduct";
import type { ProductOrderBuyer } from "@/src/models/productOrder";
import { cn, compressImage, roundMoney } from "@/src/lib/utils/utils";
import { getAuth } from "firebase/auth";
import useSWR, { mutate } from "swr";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/src/lib/firebase/firebaseConfig";
import { getOrderStatusBadgeColor } from "@/src/lib/utils/styles";

const ITEMS_PER_PAGE = 10;

function getStatusColor(status: DigitalProductStatus) {
  switch (status) {
    case DigitalProductStatus.PUBLISHED:
      return "bg-green-100 text-green-700";
    case DigitalProductStatus.DRAFT:
      return "bg-gray-100 text-gray-600";
    case DigitalProductStatus.ARCHIVED:
      return "bg-yellow-100 text-yellow-700";
    case DigitalProductStatus.DELETED:
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

function getStatusIcon(status: DigitalProductStatus) {
  switch (status) {
    case DigitalProductStatus.PUBLISHED:
      return <EyeIcon className="w-3.5 h-3.5" />;
    case DigitalProductStatus.DRAFT:
      return <Clock4Icon className="w-3.5 h-3.5" />;
    case DigitalProductStatus.ARCHIVED:
      return <Archive className="w-3.5 h-3.5" />;
    case DigitalProductStatus.DELETED:
      return <Trash2 className="w-3.5 h-3.5" />;
    default:
      return null;
  }
}

function formatDate(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatFileSize(bytes?: number): string {
  if (bytes == null || bytes === 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface ApiResponse {
  products: DigitalProduct[];
  categories: ProductCategory[];
}

const emptyProduct: Omit<DigitalProduct, "id" | "updatedAt"> = {
  title: "",
  titleAr: "",
  slug: "",
  description: "",
  descriptionAr: "",
  price: 0,
  categoryName: {
    en: "",
    ar: "",
  },
  coverImage: "",
  images: [],
  downloadableFile: undefined,
  status: DigitalProductStatus.DRAFT,
};

export default function ProductsManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const auth = getAuth();
  const authUser = auth.currentUser!;

  const { hasPermission } = usePermissions(user);
  const canView = hasPermission("Event Management", "view");
  const canCreate = hasPermission("Event Management", "create");
  const canEdit = hasPermission("Event Management", "edit");
  const canDelete = hasPermission("Event Management", "delete");

  const { data, error, isLoading } = useSWR<ApiResponse>("/api/admin/products");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<DigitalProduct | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryNameAr, setCategoryNameAr] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [categoryImage, setCategoryImage] = useState("");
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);

  const [ordersProduct, setOrdersProduct] = useState<DigitalProduct | null>(
    null,
  );
  const ordersFetcher = async (url: string) => {
    const idToken = await authUser.getIdToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
  };
  const { data: ordersData } = useSWR<{ buyers: ProductOrderBuyer[] }>(
    ordersProduct ? `/api/admin/products/${ordersProduct.id}/orders` : null,
    ordersFetcher,
  );
  const ordersBuyers = ordersData?.buyers ?? [];

  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [price, setPrice] = useState("");

  const [coverImage, setCoverImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<DigitalProductStatus>(
    DigitalProductStatus.DRAFT,
  );
  const [downloadableFileData, setDownloadableFileData] = useState<{
    fileName: string;
    fileUrl: string;
    fileFormat: string;
    fileSize: number;
  } | null>(null);
  const [filePageCount, setFilePageCount] = useState("");
  const [fileLanguage, setFileLanguage] = useState("");
  const [fileVersion, setFileVersion] = useState("");

  const products = data?.products ?? [];
  const categories = data?.categories ?? [];

  const filteredProducts = useMemo(() => {
    let result = products;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q),
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      result = result.filter((p) => p.categoryName?.en === categoryFilter);
    }

    return result;
  }, [products, searchQuery, statusFilter, categoryFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / ITEMS_PER_PAGE),
  );
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]+/g, "")
      .replace(/ +/g, "-");
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!editingProduct) {
      setSlug(generateSlug(newTitle));
    }
  };

  const resetForm = () => {
    setTitle("");
    setTitleAr("");
    setSlug("");
    setDescription("");
    setDescriptionAr("");
    setPrice("");
    setCategoryName("");
    setCategoryNameAr("");
    setCoverImage("");
    setImages([]);
    setStatus(DigitalProductStatus.DRAFT);
    setDownloadableFileData(null);
    setFilePageCount("");
    setFileLanguage("");
    setFileVersion("");
    setEditingProduct(null);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (product: DigitalProduct) => {
    setEditingProduct(product);
    setTitle(product.title);
    setTitleAr(product.titleAr);
    setSlug(product.slug);
    setDescription(product.description);
    setDescriptionAr(product.descriptionAr);
    setPrice(product.price.toString());
    setCategoryName(product.categoryName?.en ?? "");
    setCategoryNameAr(product.categoryName?.ar ?? "");
    setCoverImage(product.coverImage);
    setImages(product.images ?? []);
    setStatus(product.status);
    if (product.downloadableFile) {
      setDownloadableFileData({
        fileName: product.downloadableFile.fileName,
        fileUrl: product.downloadableFile.fileUrl,
        fileFormat: product.downloadableFile.fileFormat,
        fileSize: product.downloadableFile.fileSize,
      });
      setFilePageCount(
        product.downloadableFile.filePageCount?.toString() ?? "",
      );
      setFileLanguage(product.downloadableFile.language ?? "");
      setFileVersion(product.downloadableFile.version ?? "");
    } else {
      setDownloadableFileData(null);
      setFilePageCount("");
      setFileLanguage("");
      setFileVersion("");
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (isNaN(Number(price)) || Number(price) < 0) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    const idToken = await authUser.getIdToken();

    const productData = {
      title,
      titleAr,
      slug,
      description,
      descriptionAr,
      price: parseFloat(price),
      categoryName: {
        en: categoryName,
        ar: categoryNameAr,
      },
      coverImage,
      images,
      downloadableFile: downloadableFileData
        ? {
            fileName: downloadableFileData.fileName,
            fileUrl: downloadableFileData.fileUrl,
            fileFormat: downloadableFileData.fileFormat,
            fileSize: downloadableFileData.fileSize,
            filePageCount: filePageCount ? parseInt(filePageCount) : undefined,
            language: fileLanguage || undefined,
            version: fileVersion || undefined,
          }
        : null,
      status,
      updatedAt: new Date(),
    };

    try {
      if (editingProduct) {
        const response = await fetch(
          `/api/admin/products/${editingProduct.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({ product: productData }),
          },
        );

        if (response.ok) {
          await mutate("/api/admin/products");
          toast({
            title: "Product updated",
            description: "The product has been updated successfully",
            variant: "success",
          });
          setIsFormOpen(false);
          resetForm();
        } else {
          throw new Error("Failed to update product");
        }
      } else {
        const response = await fetch("/api/admin/products", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ product: productData }),
        });

        if (response.ok) {
          await mutate("/api/admin/products");
          toast({
            title: "Product created",
            description: "The product has been created successfully",
            variant: "success",
          });
          setIsFormOpen(false);
          resetForm();
        } else {
          throw new Error("Failed to create product");
        }
      }
    } catch {
      toast({
        title: "Error",
        description: `Failed to ${editingProduct ? "update" : "create"} product`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (
    productId: string,
    newStatus: DigitalProductStatus,
  ) => {
    try {
      const idToken = await authUser.getIdToken();
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ status: newStatus, updatedAt: new Date() }),
      });

      if (response.ok) {
        await mutate("/api/admin/products");
        toast({
          title: "Status updated",
          description: `Product status changed to ${newStatus}`,
          variant: "success",
        });
      } else {
        throw new Error("Failed to update status");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to update product status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteProductId) return;
    setIsDeleting(true);

    try {
      const idToken = await authUser.getIdToken();
      const response = await fetch(`/api/admin/products/${deleteProductId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ updatedAt: new Date() }),
      });

      if (response.ok) {
        await mutate("/api/admin/products");
        toast({
          title: "Product deleted",
          description: "The product has been marked as deleted",
          variant: "success",
        });
      } else {
        throw new Error("Failed to delete");
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteProductId(null);
    }
  };

  const getCategoryName = (categoryId: string): { en: string; ar: string } => {
    const category = categories.find((c) => c.id === categoryId);
    return {
      en: category?.name ?? "",
      ar: category?.nameAr ?? "",
    };
  };

  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryNameAr("");
    setCategorySlug("");
    setCategoryImage("");
  };

  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setCategoryName(newName);
    setCategorySlug(
      newName
        .toLowerCase()
        .replace(/[^\w\s-]+/g, "")
        .replace(/ +/g, "-"),
    );
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCategorySubmitting(true);

    try {
      const idToken = await authUser.getIdToken();
      const response = await fetch("/api/admin/categories", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: categoryName.trim(),
          nameAr: categoryNameAr.trim(),
          slug: categorySlug.trim() || generateSlug(categoryName),
          ...(categoryImage.trim() ? { image: categoryImage.trim() } : {}),
        }),
      });

      if (response.ok) {
        await mutate("/api/admin/products");
        toast({
          title: "Category created",
          description: "The category has been created successfully",
          variant: "success",
        });
        setIsCategoryDialogOpen(false);
        resetCategoryForm();
      } else {
        const err = await response.json();
        throw new Error(err.error ?? "Failed to create category");
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  if (!canView) {
    return <AccessDenied />;
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Digital Products</h1>
          <p className="text-muted-foreground">
            Manage your digital products, pricing, and files
          </p>
        </div>
        {canCreate && (
          <div className="flex flex-col items-end gap-2">
            <Button onClick={openCreateForm} className="w-40">
              <Plus className="me-2 h-4 w-4" />
              Create Product
            </Button>
            <Button
              variant="outline"
              className="w-40"
              onClick={() => {
                resetCategoryForm();
                setIsCategoryDialogOpen(true);
              }}
            >
              <FolderPlus className="me-2 h-4 w-4" />
              Create Category
            </Button>
          </div>
        )}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value={DigitalProductStatus.DRAFT}>Draft</SelectItem>
            <SelectItem value={DigitalProductStatus.PUBLISHED}>
              Published
            </SelectItem>
            <SelectItem value={DigitalProductStatus.ARCHIVED}>
              Archived
            </SelectItem>
            <SelectItem value={DigitalProductStatus.DELETED}>
              Deleted
            </SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.name}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg border">
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loading />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-12">
            <p>Failed to load products. Please try again.</p>
          </div>
        )}

        {!isLoading && !error && filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <CircleAlertIcon
              strokeWidth={1.25}
              className="mx-auto h-12 w-12 text-muted-foreground mb-4"
            />
            <p className="text-muted-foreground">
              {products.length === 0
                ? "No products yet. Create your first digital product."
                : "No products match your search."}
            </p>
          </div>
        )}

        {!isLoading && !error && filteredProducts.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="">Title</TableHead>
                    <TableHead className="">Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="">Sales</TableHead>
                    <TableHead className="">Orders</TableHead>
                    <TableHead className="">Updated</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="h-10 w-10 overflow-hidden relative rounded-md bg-muted">
                          {product.coverImage ? (
                            <Image
                              src={product.coverImage}
                              alt={product.title}
                              className="object-cover"
                              fill
                              sizes="40px"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-left">
                        <div className="font-medium w-[100px]">
                          {product.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {product.slug}
                        </div>
                      </TableCell>
                      <TableCell className="">
                        {product.categoryName?.en}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center gap-1">
                          <span className="icon-saudi_riyal text-xs" />
                          {product.price}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "gap-1 capitalize",
                            getStatusColor(product.status),
                          )}
                        >
                          {getStatusIcon(product.status)}
                          {product.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="">
                        <div className="flex items-center justify-center gap-1">
                          <span className="icon-saudi_riyal text-xs" />
                          {roundMoney(product.totalSales ?? 0).toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell className="text-orangeColor">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => setOrdersProduct(product)}
                        >
                          {product.purchaseCount ?? 0}
                          <ShoppingCart className="mr-2 h-4 w-4 " />
                        </Button>
                      </TableCell>

                      <TableCell className=" text-muted-foreground text-xs">
                        {formatDate(product.updatedAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/products/${product.slug}`}>
                                <EyeIcon className="mr-2 h-4 w-4" />
                                View
                              </Link>
                            </DropdownMenuItem>
                            {canEdit && (
                              <DropdownMenuItem
                                onClick={() => openEditForm(product)}
                              >
                                <PenLine className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => setOrdersProduct(product)}
                            >
                              <ShoppingCart className="mr-2 h-4 w-4" />
                              Orders
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {canEdit &&
                              product.status === DigitalProductStatus.DRAFT && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      product.id,
                                      DigitalProductStatus.PUBLISHED,
                                    )
                                  }
                                >
                                  <EyeIcon className="mr-2 h-4 w-4 text-green-600" />
                                  Publish
                                </DropdownMenuItem>
                              )}
                            {canEdit &&
                              product.status ===
                                DigitalProductStatus.PUBLISHED && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      product.id,
                                      DigitalProductStatus.DRAFT,
                                    )
                                  }
                                >
                                  <EyeOff className="mr-2 h-4 w-4 text-gray-600" />
                                  Unpublish
                                </DropdownMenuItem>
                              )}
                            {canEdit &&
                              product.status !==
                                DigitalProductStatus.ARCHIVED &&
                              product.status !==
                                DigitalProductStatus.DELETED && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(
                                      product.id,
                                      DigitalProductStatus.ARCHIVED,
                                    )
                                  }
                                >
                                  <Archive className="mr-2 h-4 w-4 text-yellow-600" />
                                  Archive
                                </DropdownMenuItem>
                              )}
                            {canDelete &&
                              product.status !==
                                DigitalProductStatus.DELETED && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() =>
                                      setDeleteProductId(product.id)
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(
                    currentPage * ITEMS_PER_PAGE,
                    filteredProducts.length,
                  )}{" "}
                  of {filteredProducts.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteProductId}
        onOpenChange={(open) => !open && setDeleteProductId(null)}
      >
        <AlertDialogContent dir="ltr">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will mark the product as deleted. It will no longer be
              visible to customers but will remain in the database for record
              keeping.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <LoadingDots />
              ) : (
                <>
                  <Trash2 className="h-3 w-3 me-1" /> Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Orders Dialog */}
      <Dialog
        open={!!ordersProduct}
        onOpenChange={(open) => !open && setOrdersProduct(null)}
      >
        <DialogContent
          dir="ltr"
          className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          <DialogHeader>
            <DialogTitle>
              Orders — {ordersProduct?.title ?? "Product"}
            </DialogTitle>
            <DialogDescription>
              Users who purchased this product
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto -mx-6 px-6">
            {ordersBuyers.length === 0 && !ordersData ? (
              <div className="flex justify-center py-12">
                <Loading />
              </div>
            ) : ordersBuyers.length === 0 ? (
              <p className="text-center py-12 text-muted-foreground">
                No orders yet for this product
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordersBuyers.map(({ order, userName, userEmail }) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{userName}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {userEmail}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {order.id}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(order.orderDate)}
                      </TableCell>

                      <TableCell>
                        <span className="icon-saudi_riyal text-xs" />
                        {roundMoney(order.price).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getOrderStatusBadgeColor(order.status)}
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog
        open={isCategoryDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsCategoryDialogOpen(false);
            resetCategoryForm();
          }
        }}
      >
        <DialogContent dir="ltr" className="max-w-md bg-stone-50">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Category</DialogTitle>
            <DialogDescription>
              Add a new product category. Categories help organize your digital
              products.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCategory}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="category-name">
                  Name{" "}
                  <span className="text-orangeColor text-sm">(English)</span>
                </Label>
                <Input
                  id="category-name"
                  value={categoryName}
                  onChange={handleCategoryNameChange}
                  placeholder="e.g. E-books"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category-nameAr">
                  Name <span className="text-orangeColor text-sm">(عربي)</span>
                </Label>
                <Input
                  id="category-nameAr"
                  value={categoryNameAr}
                  onChange={(e) => setCategoryNameAr(e.target.value)}
                  placeholder="مثال: كتب إلكترونية"
                  dir="rtl"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category-slug">Slug</Label>
                <Input
                  id="category-slug"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  placeholder="e-books"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="category-image">Image URL (optional)</Label>
                <Input
                  id="category-image"
                  value={categoryImage}
                  onChange={(e) => setCategoryImage(e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCategoryDialogOpen(false);
                  resetCategoryForm();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCategorySubmitting}>
                {isCategorySubmitting ? (
                  <LoadingDots />
                ) : (
                  <>
                    <CheckIcon className="h-4 w-4 me-2" />
                    Create Category
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Product Dialog */}
      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsFormOpen(false);
            resetForm();
          }
        }}
      >
        <DialogContent
          dir="ltr"
          className="max-w-4xl max-h-[90vh] overflow-y-auto bg-stone-50"
        >
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {editingProduct ? "Edit Product" : "Create New Product"}
            </DialogTitle>
            <DialogDescription>
              {editingProduct
                ? "Update the product details below"
                : "Fill in the details to create a new digital product"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              {/* Product Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid lg:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="title">
                        Title{" "}
                        <span className="text-orangeColor text-sm">
                          ( English )
                        </span>
                      </Label>
                      <Input
                        id="title"
                        value={title}
                        onChange={handleTitleChange}
                        placeholder="Enter product title"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="titleAr">
                        Title{" "}
                        <span className="text-orangeColor text-sm">
                          ( عربي )
                        </span>
                      </Label>
                      <Input
                        id="titleAr"
                        value={titleAr}
                        onChange={(e) => setTitleAr(e.target.value)}
                        placeholder="أدخل عنوان المنتج"
                        dir="rtl"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="description">
                        Description{" "}
                        <span className="text-orangeColor text-sm">
                          ( English )
                        </span>
                      </Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your product"
                        rows={6}
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="descriptionAr">
                        Description{" "}
                        <span className="text-orangeColor text-sm">
                          ( عربي )
                        </span>
                      </Label>
                      <Textarea
                        id="descriptionAr"
                        value={descriptionAr}
                        onChange={(e) => setDescriptionAr(e.target.value)}
                        placeholder="أوصف المنتج"
                        dir="rtl"
                        rows={6}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid gap-2 lg:w-1/2">
                    <Label htmlFor="slug">
                      Slug{" "}
                      <span className="text-muted-foreground text-sm">
                        "tickets.bona-banana.com/products/{slug}"
                      </span>
                    </Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(generateSlug(e.target.value))}
                      placeholder="product-slug"
                      required
                    />
                  </div>

                  <div className="grid lg:grid-cols-2 gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="price">Price</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="price"
                          value={price}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || !isNaN(Number(value))) {
                              setPrice(value);
                            }
                          }}
                          placeholder="0.00"
                          className="w-32"
                          required
                        />
                        <span className="text-muted-foreground">SR</span>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Select
                        value={JSON.stringify({
                          en: categoryName,
                          ar: categoryNameAr,
                        })}
                        onValueChange={(v) => {
                          if (!v || v.trim() === "") {
                            setCategoryName("");
                            setCategoryNameAr("");

                            return;
                          }
                          try {
                            const parsed = JSON.parse(v) as {
                              en: string;
                              ar: string;
                            };
                            setCategoryName(parsed.en);
                            setCategoryNameAr(parsed.ar);
                            const cat = categories.find(
                              (c) =>
                                c.name === parsed.en && c.nameAr === parsed.ar,
                            );
                          } catch {
                            setCategoryName("");
                            setCategoryNameAr("");
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem
                              key={cat.id}
                              value={JSON.stringify({
                                en: cat.name,
                                ar: cat.nameAr ?? "",
                              })}
                            >
                              {cat.name} - {cat.nameAr}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2 lg:w-1/2">
                    <Label htmlFor="form-status">Status</Label>
                    <Select
                      value={status}
                      onValueChange={(v) =>
                        setStatus(v as DigitalProductStatus)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DigitalProductStatus.DRAFT}>
                          <div className="flex items-center gap-1">
                            Draft
                            <Clock4Icon className="w-4 h-4 text-gray-400" />
                          </div>
                        </SelectItem>
                        <SelectItem value={DigitalProductStatus.PUBLISHED}>
                          <div className="flex items-center gap-1">
                            Published
                            <EyeIcon className="w-4 h-4 text-blue-400" />
                          </div>
                        </SelectItem>
                        <SelectItem value={DigitalProductStatus.ARCHIVED}>
                          <div className="flex items-center gap-1">
                            Archived
                            <Archive className="w-4 h-4 text-yellow-500" />
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Product Images */}
              <Card>
                <CardHeader>
                  <CardTitle>Product Images</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col lg:flex-row gap-6">
                  <div className="grid gap-4">
                    <Label>Cover Image</Label>
                    <ImageUpload
                      imageUrl={coverImage}
                      setImageUrl={setCoverImage}
                      slug={slug}
                      folder="cover"
                      inputId="cover-image-upload"
                    />
                  </div>
                  <div className="grid gap-4 flex-1">
                    <Label>Additional Images</Label>
                    <div className="flex flex-wrap gap-3">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative">
                          <div className="border rounded-md p-1 w-32 h-32 flex items-center justify-center bg-muted relative">
                            <Image
                              src={img}
                              alt={`Product image ${idx + 1}`}
                              className="w-full h-full object-cover rounded-md"
                              fill
                              sizes="128px"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                            onClick={() =>
                              setImages(images.filter((_, i) => i !== idx))
                            }
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      <AdditionalImageUpload
                        slug={slug}
                        onUpload={(url) => setImages([...images, url])}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Digital File */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Digital File
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <DigitalFileUpload
                    file={downloadableFileData}
                    onFileChange={setDownloadableFileData}
                    slug={slug}
                  />
                  {downloadableFileData && (
                    <div className="grid sm:grid-cols-3 gap-3 pt-3 border-t">
                      <div className="grid gap-2">
                        <Label htmlFor="filePageCount">Page Count</Label>
                        <Input
                          id="filePageCount"
                          value={filePageCount}
                          onChange={(e) => {
                            const v = e.target.value;
                            if (v === "" || !isNaN(Number(v)))
                              setFilePageCount(v);
                          }}
                          placeholder="e.g. 120"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fileLanguage">Language</Label>
                        <Input
                          id="fileLanguage"
                          value={fileLanguage}
                          onChange={(e) => setFileLanguage(e.target.value)}
                          placeholder="e.g. English, عربي"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="fileVersion">Version</Label>
                        <Input
                          id="fileVersion"
                          value={fileVersion}
                          onChange={(e) => setFileVersion(e.target.value)}
                          placeholder="e.g. 1.0"
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
              >
                <XIcon className="h-4 w-4 me-2" /> Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <CheckIcon className="h-4 w-4 me-2" />
                {isSubmitting
                  ? editingProduct
                    ? "Updating..."
                    : "Creating..."
                  : editingProduct
                    ? "Update Product"
                    : "Create Product"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Image Upload Components                                           */
/* ------------------------------------------------------------------ */

function ImageUpload({
  imageUrl,
  setImageUrl,
  slug,
  folder,
  inputId,
}: {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  slug: string;
  folder: string;
  inputId: string;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isURL, setIsURL] = useState(false);
  const [tempValue, setTempValue] = useState(imageUrl);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    if (file.size > 5 * 1024 * 1024) {
      file = await compressImage(file);
    }

    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);

    const ext = file.name.split(".").pop();
    const path = `products/${slug}/images/${folder}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(pct));
      },
      () => setUploading(false),
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setImageUrl(downloadUrl);
        } finally {
          setUploading(false);
          URL.revokeObjectURL(objectUrl);
          setProgress(null);
        }
      },
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div>
        <div className="border rounded-md p-1 w-48 h-48 flex flex-col items-center justify-center bg-muted relative">
          {imageUrl ? (
            <Image
              src={imageUrl || "/no-image.svg"}
              alt="Product"
              className="w-full h-full object-cover rounded-md"
              fill
              sizes="192px"
              onError={(e) => {
                e.currentTarget.src = "/no-image.svg";
              }}
            />
          ) : (
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
          )}
          <input
            type="file"
            id={inputId}
            accept="image/*"
            className="hidden"
            onChange={handleChange}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="absolute bottom-1 right-1 h-7 px-2 text-xs"
            onClick={() => document.getElementById(inputId)?.click()}
          >
            <UploadIcon className="w-4 h-4 text-redColor" />
          </Button>
        </div>
        {uploading && (
          <Progress value={progress ?? 0} max={100} className="my-1">
            {progress}%
          </Progress>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          setIsURL(!isURL);
          if (isURL) {
            setImageUrl("");
            setTempValue("");
          }
        }}
        className="text-orangeColor"
      >
        {isURL ? (
          <X className="w-4 h-4 me-1" />
        ) : (
          <>
            <PenLine className="w-4 h-4 me-1" /> Write URL
          </>
        )}
      </Button>
      {isURL && (
        <div className="flex items-center w-64 gap-2">
          <Input
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="Enter image URL"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setImageUrl(tempValue)}
          >
            Set
          </Button>
        </div>
      )}
    </div>
  );
}

function AdditionalImageUpload({
  slug,
  onUpload,
}: {
  slug: string;
  onUpload: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    if (file.size > 5 * 1024 * 1024) {
      file = await compressImage(file);
    }

    const ext = file.name.split(".").pop();
    const path = `products/${slug}/images/img_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(pct));
      },
      () => setUploading(false),
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          onUpload(downloadUrl);
        } finally {
          setUploading(false);
          setProgress(null);
        }
      },
    );
  };

  return (
    <div className="flex flex-col items-center">
      <label className="border-2 border-dashed rounded-md w-32 h-32 flex flex-col items-center justify-center bg-muted cursor-pointer hover:border-orangeColor transition-colors">
        {uploading ? (
          <div className="text-center px-2">
            <Progress value={progress ?? 0} max={100} className="mb-1" />
            <span className="text-xs text-muted-foreground">{progress}%</span>
          </div>
        ) : (
          <>
            <Plus className="h-6 w-6 text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-1">
              Add Image
            </span>
          </>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
          disabled={uploading}
        />
      </label>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Digital File Upload Component                                     */
/* ------------------------------------------------------------------ */

function DigitalFileUpload({
  file,
  onFileChange,
  slug,
}: {
  file: {
    fileName: string;
    fileUrl: string;
    fileFormat: string;
    fileSize: number;
  } | null;
  onFileChange: (
    file: {
      fileName: string;
      fileUrl: string;
      fileFormat: string;
      fileSize: number;
    } | null,
  ) => void;
  slug: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setUploading(true);

    const fileName = selectedFile.name;
    const ext = fileName.split(".").pop()?.toUpperCase() || "";
    const fileSize = selectedFile.size;

    const storagePath = `products/${slug}/${fileName}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile, {
      contentType: selectedFile.type,
    });

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(pct));
      },
      () => {
        setUploading(false);
        setProgress(null);
      },
      async () => {
        try {
          onFileChange({
            fileName,
            fileUrl: storagePath,
            fileFormat: ext,
            fileSize,
          });
        } finally {
          setUploading(false);
          setProgress(null);
        }
      },
    );

    e.target.value = "";
  };

  if (file) {
    return (
      <div className="border rounded-lg p-4 bg-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-orangeColor" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{file.fileName}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <Badge variant="outline" className="text-xs px-1.5 py-0">
                  {file.fileFormat}
                </Badge>
                <span>{formatFileSize(file.fileSize)}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                document.getElementById("digital-file-replace")?.click()
              }
            >
              <RefreshCcw className="h-3.5 w-3.5 me-1" />
              Replace
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => onFileChange(null)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <input
          type="file"
          id="digital-file-replace"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor="digital-file-upload"
        className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-orangeColor transition-colors bg-white"
      >
        {uploading ? (
          <div className="w-full max-w-xs text-center">
            <Progress value={progress ?? 0} max={100} className="mb-2" />
            <span className="text-sm text-muted-foreground">
              Uploading... {progress}%
            </span>
          </div>
        ) : (
          <>
            <UploadIcon className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm font-medium">
              Click to upload a digital file
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, EPUB, ZIP, or any file type
            </p>
          </>
        )}
      </label>
      <input
        type="file"
        id="digital-file-upload"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />
    </div>
  );
}
