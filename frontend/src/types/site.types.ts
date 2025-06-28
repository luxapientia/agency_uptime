export interface Site {
  id: string;
  name: string;
  url: string;
  checkInterval: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteData {
  name: string;
  url: string;
  checkInterval: number;
}

export interface UpdateSiteData extends Partial<CreateSiteData> {
  isActive?: boolean;
}

export interface SiteState {
  sites: Site[];
  isLoading: boolean;
  error: string | null;
  selectedSite: Site | null;
} 