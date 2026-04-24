/**
 * useBfhl.js — State machine hook for BFHL form submission.
 *
 * States: idle → loading → success | error
 * Exposes: submit(edges), reset(), result, error, status
 */

import { useState, useCallback } from 'react';
import { submitEdges } from '../lib/api';

/** @typedef {'idle'|'loading'|'success'|'error'} BfhlStatus */

/**
 * @returns {{
 *   status: BfhlStatus,
 *   result: Object|null,
 *   error: string|null,
 *   submit: (edges: string[]) => Promise<void>,
 *   reset: () => void,
 * }}
 */
export function useBfhl() {
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = useCallback(async (edges) => {
    setStatus('loading');
    setError(null);
    setResult(null);

    try {
      const data = await submitEdges(edges);
      setResult(data);
      setStatus('success');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStatus('idle');
    setResult(null);
    setError(null);
  }, []);

  return { status, result, error, submit, reset };
}
