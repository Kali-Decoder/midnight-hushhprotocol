// Browser shim for isomorphic-ws: midnight-js imports a named `WebSocket`.
export default globalThis.WebSocket;
export const WebSocket = globalThis.WebSocket;
