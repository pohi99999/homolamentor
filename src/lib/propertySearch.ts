export interface TeaserResult {
  id: string;
  category: string;
  locationHint: string;
  priceRange?: string;
  summary: string;
  features: string[];
}

export interface PropertySearchResponse {
  results: TeaserResult[];
  notice?: string;
}
