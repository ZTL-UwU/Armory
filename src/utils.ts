// @ts-expect-error - child_process is available in Node.js runtime
import { execSync } from 'node:child_process';

export function exec(command: string): string {
  return (execSync(command).toString() as string).trim();
}
