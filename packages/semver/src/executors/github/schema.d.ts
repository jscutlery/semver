export interface GithubExecutorSchema {
  tag: string;
  branch?: string;
  files?: string[];
  notes?: string;
  notesFile?: string;
}
