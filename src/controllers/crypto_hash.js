import { createHash } from "node:crypto";
const algo = 'sha256';

export function hash(data, key) {
    return createHash(algo, key).update(data).digest('base64');
}