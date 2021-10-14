export interface GithubExecutorSchema {
  tag: string;
  branch?: string;
  files?: string[];
  notes?: string;
  notesFile?: string;
  draft?: string;
  title?: string;
  prerelease?: string;
  discussionCategory?: string;
  repo?: string;  
}
