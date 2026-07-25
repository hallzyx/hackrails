export const config = {
  apiUrl: process.env.API_URL ?? "http://api:4000",
  port: Number(process.env.PORT ?? 4001),
} as const;