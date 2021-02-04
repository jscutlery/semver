export interface SemverPlugin {
  publish?(): Promise<void>;
}
