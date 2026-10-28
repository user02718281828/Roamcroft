import type { ErrorEvent } from '@sentry/react';

/** Only diagnostic code locations cross this boundary; never serialize game state. */
export function privateErrorEvent(event: ErrorEvent, release: string): ErrorEvent | null {
  const values = event.exception?.values;
  if (!values?.length) return null;
  return {
    type: undefined,
    event_id: event.event_id,
    timestamp: event.timestamp,
    platform: 'javascript',
    level: 'error',
    release,
    exception: {values: values.map(exception => ({
      type: ['Error', 'TypeError', 'RangeError', 'ReferenceError', 'SyntaxError', 'URIError', 'EvalError'].includes(exception.type || '') ? exception.type : 'Error',
      value: 'Browser error (private details omitted)',
      stacktrace: {frames: exception.stacktrace?.frames?.map(frame => ({
        filename: frame.filename?.match(/\/(?:assets|_next\/static\/chunks)\/([a-zA-Z0-9_.-]+\.js)(?:[?#].*)?$/)?.[1],
        lineno: frame.lineno,
        colno: frame.colno,
        in_app: frame.in_app,
      }))},
    }))},
  };
}
