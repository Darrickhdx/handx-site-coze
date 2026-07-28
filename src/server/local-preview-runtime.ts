import type {
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from 'node:http';

export type FallbackRequestHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => void | Promise<void>;

export interface LocalPreviewRuntimeOptions {
  readonly projectRoot: string;
  readonly privateDataDirectory: string;
  readonly bind: Readonly<{
    hostname: string;
    port: number;
  }>;
  readonly deploymentEnvironment?: string;
  readonly fallback: FallbackRequestHandler;
}

const localOnlyHeaders = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
};

export function createLocalPreviewRuntime(
  options: Readonly<LocalPreviewRuntimeOptions>,
): RequestListener {
  return (request, response) => {
    void handleRequest(options, request, response);
  };
}

async function handleRequest(
  options: Readonly<LocalPreviewRuntimeOptions>,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  for (const [name, value] of Object.entries(localOnlyHeaders)) {
    response.setHeader(name, value);
  }

  try {
    await options.fallback(request, response);
  } catch (error) {
    console.error('Error occurred handling', request.url, error);
    if (response.headersSent) {
      response.destroy();
      return;
    }
    response.statusCode = 500;
    response.end('Internal server error');
  }
}
