export type Project = {
  id: string;
  name: string;
  html_content: string;
  user_id: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectInput = {
  name: string;
  html_content: string;
  is_public?: boolean;
};
