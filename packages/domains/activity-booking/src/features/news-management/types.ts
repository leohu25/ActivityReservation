export interface NewsDto {
  id: string;
  title: string;
  summary?: string | null;
  content: string;
  author?: string | null;
  isTop: boolean;
  status: string;
}
