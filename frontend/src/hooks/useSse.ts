import { useEffect, useRef } from 'react';

type SseHandlers = Record<string, (data: unknown) => void>;

export function useSse(url: string, handlers: SseHandlers) {
  const handlersRef = useRef<SseHandlers>(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const es = new EventSource(url);

    Object.keys(handlersRef.current).forEach(eventName => {
      es.addEventListener(eventName, (e: MessageEvent) => {
        handlersRef.current[eventName](JSON.parse(e.data));
      });
    });

    es.onerror = err => console.error('SSE error:', err);

    return () => es.close();
  }, [url]);
}
