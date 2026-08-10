import { createServer } from 'node:http';
import next from 'next';
import {
  PUBLIC_EDITION_SCOPE,
  createPublicEditionRuntime,
} from './server/public-edition-runtime';

/**
 * Entry point for the public edition. src/server.ts stays the workbench entry
 * and keeps refusing anything but loopback; neither file imports the other.
 */
const hostname = process.env.HOSTNAME || '0.0.0.0';
const port = Number.parseInt(process.env.PORT || '3000', 10);
const searchIndexing =
  process.env.PUBLIC_SEARCH_INDEXING === 'allowed' ? 'allowed' : 'blocked';

const app = next({ dev: false, hostname, port });
const listener = createPublicEditionRuntime({
  bind: { hostname, port },
  acknowledgement: process.env.PUBLIC_EDITION_ACK,
  searchIndexing,
  fallback: app.getRequestHandler(),
});

app.prepare().then(() => {
  const server = createServer(listener);
  server.once('error', (error) => {
    console.error(error);
    process.exit(1);
  });
  server.listen(port, hostname, () => {
    console.log(
      `> Public edition on ${hostname}:${port} ` +
        `(scope ${PUBLIC_EDITION_SCOPE}, search indexing ${searchIndexing})`,
    );
  });
});
