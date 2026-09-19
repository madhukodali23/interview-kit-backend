export interface CompanyBrief {
  overview: string;
  products: string[];
  industry: string;
  culture: string[];
  engineering: string[];

  isUserEdited?: boolean;
}