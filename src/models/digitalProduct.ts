export enum DigitalProductStatus {
  DRAFT = "draft",
  PUBLISHED = "published",
  ARCHIVED = "archived",
  DELETED = "deleted",
}

export interface DigitalProduct {
  id: string;
  title: string;
  titleAr: string;
  slug: string;
  description: string;
  descriptionAr: string;
  price: number;
  categoryName?: {
    en: string;
    ar: string;
  };
  coverImage: string;
  images?: string[];
  downloadableFile?: {
    fileName: string;
    filePath: string;
    fileFormat: string;
    fileSize: number;
    filePageCount?: number;
    language?: string;
    version?: string;
  };
  status: DigitalProductStatus;
  totalSales?: number;
  purchaseCount?: number;
  updatedAt: Date;
}

export interface ProductCategory {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  image?: string;
}

export interface DigitalProductFile {
  id: string;
  productId: string;
  fileName: string;
  filePath: string;
  fileFormat: string;
  fileType: string;
  fileSize: number;
  filePageCount: number;
  language: string;
  version: string;
}
