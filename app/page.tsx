'use client';

import * as Sentry from '@sentry/react';
import Launcher from '@/components/game/Launcher';

if (typeof window !== 'undefined' && !Sentry.getClient()) {
  Sentry.init({
    dsn: 'https://2930a348f46704e33cbec716f6980fb5@o4512335936815104.ingest.de.sentry.io/4512335980658768',
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
  });
}

export default function Home() {
  return <Launcher />;
}