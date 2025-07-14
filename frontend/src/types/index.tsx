// src/types/index.tsx

export interface BrokenLink {
  url: string;
  status_code: number;
}

export interface Result {
  id?: number;
  url: string;
  html_version: string;
  title: string;
  internal_links: number;
  external_links: number;
  has_login_form: boolean;
  status: string;
  broken_links: BrokenLink[];
  created_at: string;
}

export interface DetailsDialogProps {
  open: boolean;
  onClose: () => void;
  row: Result | null;
}