declare module 'node:fs' { export function readFileSync(path:string, encoding:string): string; export function writeFileSync(path:string, data:string): void; }
