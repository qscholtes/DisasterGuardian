import { useCallback, useEffect, useRef } from 'react';

// A refresh owns its result only until another refresh starts or the screen leaves.
export default function useLatestRequest() {
  const generation = useRef(0);
  const cancel = useCallback(() => {
    generation.current += 1;
  }, []);
  const begin = useCallback(() => {
    const request = ++generation.current;
    return () => request === generation.current;
  }, []);

  useEffect(() => cancel, [cancel]);
  return { begin, cancel };
}
