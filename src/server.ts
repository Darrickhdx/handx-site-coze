import { createServer } from 'node:http';
import { resolve } from 'node:path';
import next from 'next';
import { createLocalPreviewRuntime } from './server/local-preview-runtime';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || '127.0.0.1';
const port = Number.parseInt(process.env.PORT || '5000', 10);
const projectRoot = resolve(process.cwd());
const privateDataDirectory = resolve(
  process.env.LOCAL_DATA_DIR || resolve(projectRoot, 'private-runtime'),
);

const app = next({ dev, hostname, port });
const fallback = app.getRequestHandler();
const listener = createLocalPreviewRuntime({
  projectRoot,
  privateDataDirectory,
  bind: { hostname, port },
  deploymentEnvironment: process.env.COZE_PROJECT_ENV,
  fallback,
});

app.prepare().then(() => {
  const server = createServer(listener);
  server.once('error', error => {
    console.error(error);
    process.exit(1);
  });
  server.listen(port, hostname, () => {
    console.log(
      `> Local-only preview at http://${hostname}:${port} (${dev ? 'development' : 'production build'})`,
    );
  });
});
