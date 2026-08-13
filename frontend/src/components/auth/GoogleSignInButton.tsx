import { useEffect, useRef, useState } from 'react';

type GoogleCredentialResponse = { credential: string };

type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
    }) => void;
    renderButton: (
      element: HTMLElement,
      options: Record<string, string | number | boolean>,
    ) => void;
    cancel: () => void;
    disableAutoSelect?: () => void;
  };
};

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts };
  }
}

const GOOGLE_SCRIPT_ID = 'google-identity-services';

export function GoogleSignInButton({
  onCredential,
  onError,
}: {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(Boolean(window.google));
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId) return;
    if (window.google) {
      setScriptReady(true);
      return;
    }

    const existing = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    const handleLoad = () => setScriptReady(true);
    const handleError = () => onError('Google sign-in could not be loaded. Please try again.');
    if (existing) {
      existing.addEventListener('load', handleLoad);
      existing.addEventListener('error', handleError);
      return () => {
        existing.removeEventListener('load', handleLoad);
        existing.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.id = GOOGLE_SCRIPT_ID;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = handleLoad;
    script.onerror = handleError;
    document.head.appendChild(script);
  }, [clientId, onError]);

  useEffect(() => {
    if (!clientId || !scriptReady || !window.google || !containerRef.current) return;
    containerRef.current.innerHTML = '';
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => onCredential(response.credential),
      auto_select: false,
      cancel_on_tap_outside: true,
    });
    window.google.accounts.id.renderButton(containerRef.current, {
      type: 'standard',
      theme: 'filled_black',
      size: 'large',
      text: 'continue_with',
      shape: 'pill',
      logo_alignment: 'left',
      width: Math.min(360, containerRef.current.clientWidth || 320),
    });
    return () => window.google?.accounts.id.cancel();
  }, [clientId, scriptReady, onCredential]);

  if (!clientId) {
    return (
      <button
        type="button"
        onClick={() => onError('Add your Google client ID to enable Google sign-in.')}
        className="w-full h-11 rounded-full border border-white/15 bg-white/[0.06] text-white/55 text-sm font-medium flex items-center justify-center gap-3 hover:bg-white/[0.09] transition-colors"
      >
        <span className="font-bold text-base">G</span>
        Continue with Google
      </button>
    );
  }

  return <div ref={containerRef} className="min-h-11 flex justify-center" />;
}
