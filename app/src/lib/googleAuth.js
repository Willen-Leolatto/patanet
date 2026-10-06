// src/lib/googleAuth.js
// Camada fina sobre o Google Identity Services (web) e o plugin nativo do
// Capacitor (Android/iOS), para obter um ID token verificável no backend.
import { Capacitor } from "@capacitor/core";
import { SocialLogin } from "@capgo/capacitor-social-login";

export const GOOGLE_CLIENT_ID_WEB = import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB || "";

let nativeInitPromise = null;
let gisLoadingPromise = null;

export function isGoogleSignInConfigured() {
  return Boolean(GOOGLE_CLIENT_ID_WEB);
}

export function isNativePlatform() {
  return Capacitor.isNativePlatform?.() ?? false;
}

async function ensureNativeInitialized() {
  if (!nativeInitPromise) {
    nativeInitPromise = SocialLogin.initialize({
      google: {
        webClientId: GOOGLE_CLIENT_ID_WEB,
        mode: "online",
      },
    });
  }
  return nativeInitPromise;
}

// Fluxo nativo (Android/iOS): usado porque o Google não permite login OAuth
// dentro de WebViews embutidas (exigência para publicação no Google Play).
export async function signInWithGoogleNative() {
  if (!isGoogleSignInConfigured()) {
    throw new Error("Login com Google não está configurado neste app.");
  }
  await ensureNativeInitialized();
  const { result } = await SocialLogin.login({
    provider: "google",
    options: { scopes: ["email", "profile"] },
  });
  const idToken = result?.idToken;
  if (!idToken) {
    throw new Error("Não foi possível obter as credenciais do Google.");
  }
  return idToken;
}

// Fluxo web: carrega o script oficial do Google Identity Services sob
// demanda (só quando a tela realmente oferece login com o Google).
export function loadGoogleIdentityServices() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Sign-In indisponível neste ambiente."));
  }
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (gisLoadingPromise) return gisLoadingPromise;

  gisLoadingPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector("script[data-google-identity-services]");
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google));
      existing.addEventListener("error", () =>
        reject(new Error("Falha ao carregar o Google Sign-In.")),
      );
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.dataset.googleIdentityServices = "true";
    script.onload = () => resolve(window.google);
    script.onerror = () => reject(new Error("Falha ao carregar o Google Sign-In."));
    document.head.appendChild(script);
  });

  return gisLoadingPromise;
}
