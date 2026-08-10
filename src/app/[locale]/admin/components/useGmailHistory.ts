"use client";

import { useEffect, useState } from "react";

export interface GmailMessage {
  id: string;
  subject: string;
  date: string;
  snippet: string;
  direction: string;
  from?: string;
  to?: string;
}

/**
 * Élő Gmail előzmények betöltése egy partner e-mail címéhez.
 * `null` email esetén nem indít hálózati hívást és üríti a listát.
 */
export function useGmailHistory(email: string | null) {
  const [messages, setMessages] = useState<GmailMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- származtatott állapot ürítése, amikor megszűnik a kijelölés
      setMessages([]);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/gmail-history?email=${encodeURIComponent(email)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        setMessages(data.messages ?? []);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Gmail history fetch error:", err);
        setError("Nem sikerült betölteni az e-mail előzményeket.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [email]);

  return { messages, loading, error };
}
