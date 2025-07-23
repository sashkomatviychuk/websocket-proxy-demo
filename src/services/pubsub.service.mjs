// @ts-check
import { createClient } from 'redis';

export const pub = createClient();
export const sub = pub.duplicate();

await pub.connect();
await sub.connect();
