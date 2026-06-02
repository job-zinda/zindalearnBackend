// function parseOriginList(value) {
//   if (!value || typeof value !== "string") return [];
//   return value
//     .split(",")
//     .map((s) => s.trim())
//     .filter(Boolean);
// }

// function buildExplicitOrigins() {
//   const fromEnv = [
//     ...parseOriginList(process.env.FRONTEND_URL),
//     ...parseOriginList(process.env.ADDITIONAL_CORS_ORIGINS),
//   ];
//   const defaults = [
//     "http://localhost:5173",
//     "http://localhost:3000",
//     "https://www.zindaonlineschool.com",
//     "https://zindaonlineschool.com",
//     "https://zinda-learn-frontend.vercel.app",
//     "https://jobzinda.vercel.app",
//   ];
//   return [...new Set([...defaults, ...fromEnv])];
// }

// /**
//  * @param {string | undefined} origin Request Origin header (absent for same-origin / some tools)
//  */
// export function isOriginAllowed(origin) {
//   if (!origin) return true;

//   const explicit = buildExplicitOrigins();
//   if (explicit.includes(origin)) return true;

//   try {
//     const { hostname, protocol } = new URL(origin);
//     if (protocol !== "https:" && protocol !== "http:") return false;
//     if (hostname === "localhost") return true;
//     if (hostname === "vercel.app" || hostname.endsWith(".vercel.app")) return true;
//     return false;
//   } catch {
//     return false;
//   }
// }
















// function cleanOrigin(value) {
//   return String(value || "").trim().replace(/\/+$/, "");
// }

// function parseOriginList(value) {
//   if (!value || typeof value !== "string") return [];

//   return value
//     .split(",")
//     .map((item) => cleanOrigin(item))
//     .filter(Boolean);
// }

// function buildAllowedOrigins() {
//   const envOrigins = [
//     ...parseOriginList(process.env.FRONTEND_URL),
//     ...parseOriginList(process.env.ADDITIONAL_CORS_ORIGINS),
//   ];

//   const defaultOrigins = [
//     "http://localhost:5173",
//     "http://localhost:3000",
//     "https://www.zindaonlineschool.com",
//     "https://zindaonlineschool.com",
//     "https://zinda-learn-frontend.vercel.app",
//     "https://jobzinda.vercel.app",
//   ];

//   return [...new Set([...defaultOrigins, ...envOrigins].map(cleanOrigin))];
// }

// export function isOriginAllowed(origin) {
//   if (!origin) return true;

//   const requestOrigin = cleanOrigin(origin);
//   const allowedOrigins = buildAllowedOrigins();

//   return allowedOrigins.includes(requestOrigin);
// }




























function cleanOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function parseOriginList(value) {
  if (!value || typeof value !== "string") return [];

  return value
    .split(",")
    .map((item) => cleanOrigin(item))
    .filter(Boolean);
}

function buildAllowedOrigins() {
  const envOrigins = [
    ...parseOriginList(process.env.FRONTEND_URL),
    ...parseOriginList(process.env.ADDITIONAL_CORS_ORIGINS),
  ];

  const defaultOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://www.zindaonlineschool.com",
    "https://zindaonlineschool.com",
    "https://zinda-learn-frontend.vercel.app",
    "https://jobzinda.vercel.app",
  ];

  return [...new Set([...defaultOrigins, ...envOrigins].map(cleanOrigin))];
}

export function isOriginAllowed(origin) {
  if (!origin) return true;

  const requestOrigin = cleanOrigin(origin);
  const allowedOrigins = buildAllowedOrigins();

  return allowedOrigins.includes(requestOrigin);
}