// Polyfill Web API globals for Jest's VM sandbox.
// Node 18+ has fetch/Request/Response/Headers natively on the outer process
// globalThis, but Jest's VM context may not inherit them automatically.
// This setupFiles entry runs before test modules are imported.

import { TextDecoder, TextEncoder } from "util"

if (typeof globalThis.TextEncoder === "undefined") {
  Object.defineProperty(globalThis, "TextEncoder", {
    writable: true,
    configurable: true,
    value: TextEncoder,
  })
}

if (typeof globalThis.TextDecoder === "undefined") {
  Object.defineProperty(globalThis, "TextDecoder", {
    writable: true,
    configurable: true,
    value: TextDecoder,
  })
}
