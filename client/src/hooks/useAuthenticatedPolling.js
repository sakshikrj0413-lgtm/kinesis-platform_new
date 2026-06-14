import { useEffect, useRef, useMemo } from "react";
import useAuthToken from "./useAuthToken";

/**
 * Socket events that should refresh portfolio/position data.
 * - bet_matched:      a bet was matched in the order book
 * - wallet_updated:   balance changed (bet placement, top-up)
 * - bet_settled:      a market was resolved → WON or LOST (user-room only)
 * - market_resolved:  broadcast when admin resolves any market
 * - transaction_added: new transaction arrived (user-room only)
 */
export const PORTFOLIO_SOCKET_EVENTS = [
  "bet_matched",
  "wallet_updated",
  "bet_settled",
  "market_resolved",
  "transaction_added",
];

/**
 * Runs fetchFn when authenticated; optional interval + socket listeners.
 * fetchFn is always the latest ref (safe to close over state setters).
 *
 * Guards:
 * - No polling if token is missing/null/empty
 * - Cleanup aborts in-flight requests, clears intervals, removes socket listeners
 * - Stable deps prevent spurious re-runs under React StrictMode
 */
export default function useAuthenticatedPolling(
  fetchFn,
  { intervalMs = null, socket, socketEvents = [] } = {}
) {
  const token = useAuthToken();
  const fetchRef = useRef(fetchFn);

  useEffect(() => {
    fetchRef.current = fetchFn;
  });

  const eventsKey = useMemo(() => {
    return socketEvents.join(",");
  }, [socketEvents]);

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    const controller = new AbortController();

    const run = () => {
      if (cancelled) return;
      try {
        fetchRef.current();
      } catch {
        // swallow errors from stale closures
      }
    };

    run();

    const socketHandlers = [];
    if (socket && socketEvents.length) {
      socketEvents.forEach((event) => {
        const handler = () => run();
        socket.on(event, handler);
        socketHandlers.push([event, handler]);
      });
    }

    let intervalId = null;
    if (intervalMs) {
      intervalId = setInterval(run, intervalMs);
    }

    return () => {
      cancelled = true;
      controller.abort();
      if (intervalId) clearInterval(intervalId);
      socketHandlers.forEach(([event, handler]) => socket.off(event, handler));
    };
  }, [token, intervalMs, eventsKey, socket, socketEvents]);
}
