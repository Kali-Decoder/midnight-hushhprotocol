import type {NextConfig} from "next";
import {createRequire} from "node:module";
import path from "node:path";
import {fileURLToPath} from "node:url";

const require = createRequire(import.meta.url);

const isDev = process.env.NODE_ENV !== "production";

function originOf(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

const connectSrc = [
  "'self'",
  originOf(process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_URL),
  originOf(process.env.NEXT_PUBLIC_MIDNIGHT_INDEXER_WS_URL),
  originOf(process.env.NEXT_PUBLIC_MIDNIGHT_NODE_URL),
  originOf(process.env.NEXT_PUBLIC_MIDNIGHT_PROOF_SERVER_URL),
  // Local Midnight devnet: indexer, node, proof server.
  ...(isDev || process.env.NEXT_PUBLIC_MIDNIGHT_NETWORK === "undeployed"
    ? [
        "http://localhost:8088",
        "ws://localhost:8088",
        "http://localhost:9944",
        "ws://localhost:9944",
        "http://127.0.0.1:6300",
        "http://localhost:6300",
      ]
    : []),
  // Public Midnight networks (endpoints come from the connected wallet).
  "https://*.midnight.network",
  "wss://*.midnight.network",
  "https://*.blockfrost.io",
  "wss://*.blockfrost.io",
  // Privy (Twitter OAuth)
  "https://auth.privy.io",
  "https://*.privy.io",
  "https://api.privy.io",
  "https://privy.auth0.com",
  isDev ? "ws:" : null,
  isDev ? "wss:" : null,
].filter(Boolean);

const scriptSrc = [
  "'self'",
  "'unsafe-inline'",
  "'wasm-unsafe-eval'",
  isDev ? "'unsafe-eval'" : null,
].filter(Boolean);

const csp = [
  `default-src 'self'`,
  `script-src ${scriptSrc.join(" ")}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https:`,
  `font-src 'self' data:`,
  `connect-src ${connectSrc.join(" ")}`,
  `worker-src 'self' blob:`,
  `frame-src 'self' https://auth.privy.io https://*.privy.io`,
  `frame-ancestors 'none'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `object-src 'none'`,
].join("; ");

const securityHeaders = [
  {key: "Content-Security-Policy", value: csp},
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {key: "X-Frame-Options", value: "DENY"},
  {key: "X-Content-Type-Options", value: "nosniff"},
  {key: "Referrer-Policy", value: "strict-origin-when-cross-origin"},
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const appRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["@privy-io/react-auth"],
  // Load the Midnight WASM runtimes with Node's own loader on the server
  // (the attestation route), instead of bundling them.
  serverExternalPackages: [
    "@midnight-ntwrk/compact-runtime",
    "@midnightntwrk/onchain-runtime-v4",
    "@midnightntwrk/ledger-v9",
  ],
  // The shared Hushh SDK lives in ../midnight/src/sdk.
  experimental: {externalDir: true},
  webpack: (config, {isServer, webpack}) => {
    // Bare imports made from ../midnight (the shared SDK and the compiled
    // contracts) resolve from THIS app's node_modules, so there is exactly
    // one copy of the Midnight WASM runtimes in the bundle.
    config.module.rules.push({
      test: /[\\/]midnight[\\/](src|contracts)[\\/]/,
      resolve: {modules: [path.join(appRoot, "node_modules"), "node_modules"]},
    });
    config.resolve.alias = {
      ...config.resolve.alias,
      "@hushh/sdk$": path.join(appRoot, "..", "midnight", "src", "sdk", "index.ts"),
      "@hushh/sdk": path.join(appRoot, "..", "midnight", "src", "sdk"),
    };
    // midnight-js imports `.js` specifiers that are `.ts` files in the SDK.
    config.resolve.extensionAlias = {".js": [".ts", ".tsx", ".js"]};
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        child_process: false,
        path: false,
        os: false,
        buffer: require.resolve("buffer/"),
      };
      config.resolve.alias["isomorphic-ws"] = path.join(appRoot, "src", "lib", "midnight", "isomorphic-ws.mjs");
      config.plugins.push(
        new webpack.ProvidePlugin({Buffer: ["buffer", "Buffer"]}),
        new webpack.NormalModuleReplacementPlugin(/^node:buffer$/, (r: {request: string}) => {
          r.request = "buffer";
        }),
      );
    }
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };
    return config;
  },
  async headers() {
    return [{source: "/:path*", headers: securityHeaders}];
  },
};

export default nextConfig;
