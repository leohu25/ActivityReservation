export interface VenueDto {
  id: string;
  code: string;
  name: string;
  address?: string | null;
  openTime?: string | null;
  contactPhone?: string | null;
}
