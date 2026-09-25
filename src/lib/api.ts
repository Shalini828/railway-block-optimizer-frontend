import { toast } from "sonner";

const LOCAL_API_BASE = "http://127.0.0.1:8000";
const PRODUCTION_API_BASE =
"https://railway-block-optimizer-backend.onrender.com";

// Use localhost only during local development.
// Always use the Render backend in the deployed production build.
export const API_BASE = import.meta.env.DEV
? LOCAL_API_BASE
: PRODUCTION_API_BASE;

let authToken: string | null = null;

let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
authToken = token;
}

export function getAuthToken(): string | null {
return authToken;
}

export function setUnauthorizedHandler(handler: () => void) {
unauthorizedHandler = handler;
}

export async function apiFetch(
path: string,
init?: RequestInit
): Promise<Response> {
// Normalize path if a full localhost URL is passed.
let cleanPath = path;

if (cleanPath.startsWith("http://localhost:8000")) {
cleanPath = cleanPath.replace("http://localhost:8000", "");
} else if (cleanPath.startsWith("http://127.0.0.1:8000")) {
cleanPath = cleanPath.replace("http://127.0.0.1:8000", "");
} else if (
cleanPath.startsWith("https://railway-block-optimizer-backend.onrender.com")
) {
cleanPath = cleanPath.replace(
"https://railway-block-optimizer-backend.onrender.com",
""
);
}

if (!cleanPath.startsWith("/")) {
cleanPath = "/" + cleanPath;
}

const url = `${API_BASE}${cleanPath}`;

const headers = new Headers(init?.headers);

if (authToken && !headers.has("Authorization")) {
headers.set("Authorization", `Bearer ${authToken}`);
}

if (
init?.body &&
typeof init.body === "string" &&
!headers.has("Content-Type")
) {
headers.set("Content-Type", "application/json");
}

const config: RequestInit = {
...init,
headers,
};

try {
const response = await fetch(url, config);

if (response.status === 401 && cleanPath !== "/auth/login") {
  toast.error("Session expired — please sign in again", {
    description: "सत्र समाप्त हो गया है — कृपया पुनः साइन इन करें",
  });

  if (unauthorizedHandler) {
    unauthorizedHandler();
  }
} else if (response.status === 403) {
  toast.error("Not authorised for this action", {
    description: "इस कार्रवाई के लिए अधिकृत नहीं हैं (Access Restricted)",
  });
}

return response;

} catch (error) {
console.error("API request failed:", {
url,
error,
});

throw error;


}
}
