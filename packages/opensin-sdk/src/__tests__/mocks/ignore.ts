export default class Ignore {
  add(pattern: any) { return this; }
  ignores(path: string) { return false; }
  filter(paths: string[]) { return paths; }
  createFilter() { return () => true; }
}
export function ignore() { return new Ignore(); }
