export interface GithubExecutorSchema {
  tag: string;
  branch?: string;
  files?: string[];
  notes?: string;
  notesFile?: string;
  draft?: boolean;
  title?: string;
  prerelease?: boolean;
  discussionCategory?: string;
  repo?: string;  
}
