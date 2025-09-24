import { useCallback, useEffect, useReducer, useRef } from 'react';

type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retryCount: number;
};

type AsyncAction<T> =
  | { type: 'LOADING' }
  | { type: 'SUCCESS'; payload: T }
  | { type: 'ERROR'; payload: Error }
  | { type: 'RETRY' }
  | { type: 'RESET' };

function asyncReducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case 'LOADING':
      return { ...state, loading: true, error: null };
    case 'SUCCESS':
      return { data: action.payload, loading: false, error: null, retryCount: 0 };
    case 'ERROR':
      return { ...state, data: null, loading: false, error: action.payload };
    case 'RETRY':
      return { ...state, retryCount: state.retryCount + 1 };
    case 'RESET':
      return { data: null, loading: false, error: null, retryCount: 0 };
    default:
      return state;
  }
}

interface UseAsyncDataOptions {
  retries?: number;
  retryDelay?: number;
  onSuccess?: <T>(data: T) => void;
  onError?: (error: Error) => void;
  initialLoad?: boolean;
}

export function useAsyncData<T>(
  asyncFunction: () => Promise<T>,
  dependencies: any[] = [],
  options: UseAsyncDataOptions = {}
) {
  const {
    retries = 3,
    retryDelay = 1000,
    onSuccess,
    onError,
    initialLoad = true,
  } = options;

  const [state, dispatch] = useReducer(asyncReducer<T>, {
    data: null,
    loading: false,
    error: null,
    retryCount: 0,
  });

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const execute = useCallback(async () => {
    if (!mountedRef.current) return;

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    dispatch({ type: 'LOADING' });

    try {
      const data = await asyncFunction();

      if (!mountedRef.current) return;

      dispatch({ type: 'SUCCESS', payload: data });
      onSuccess?.(data);
    } catch (error: any) {
      if (!mountedRef.current) return;

      // Don't handle abort errors
      if (error.name === 'AbortError') return;

      const shouldRetry = state.retryCount < retries && !error.message?.includes('404');

      if (shouldRetry) {
        dispatch({ type: 'RETRY' });
        setTimeout(() => {
          if (mountedRef.current) {
            execute();
          }
        }, retryDelay * Math.pow(2, state.retryCount)); // Exponential backoff
      } else {
        dispatch({ type: 'ERROR', payload: error as Error });
        onError?.(error as Error);
      }
    }
  }, [asyncFunction, state.retryCount, retries, retryDelay, onSuccess, onError]);

  const refresh = useCallback(() => {
    dispatch({ type: 'RESET' });
    execute();
  }, [execute]);

  const retry = useCallback(() => {
    dispatch({ type: 'RETRY' });
    execute();
  }, [execute]);

  useEffect(() => {
    mountedRef.current = true;

    if (initialLoad) {
      execute();
    }

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
    retry,
    retryCount: state.retryCount,
  };
}