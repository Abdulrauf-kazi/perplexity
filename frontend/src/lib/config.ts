// Set at build time by the CD workflow. Falls back to the local backend in development.
export const BACKEND_URL = process.env.BUN_PUBLIC_BACKEND_URL || "http://localhost:3001"
