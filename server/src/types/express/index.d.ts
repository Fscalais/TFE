// src/types/express/index.d.ts

declare namespace Express {
  // Add ONLY what you need to Request/Response.
  interface Request {
    user?: any;
  }
}

export {};
