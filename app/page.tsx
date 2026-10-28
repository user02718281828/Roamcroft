'use client';

import * as Sentry from '@sentry/react';
import Launcher from '@/components/game/Launcher';
import { privateErrorEvent } from '@/lib/monitoring/privacy';
import { GAME_VERSION } from '@/lib/version';

if (typeof window !== 'undefined' && !Sentry.getClient()) {
  Sentry.init({
    dsn: 'https://2930a348f46704e33cbec716f6980fb5@o4512335936815104.ingest.de.sentry.io/4512335980658768',
    tracesSampleRate: 0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    dataCollection: {userInfo: false, cookies: false, httpHeaders: false, httpBodies: [], urlQueryParams: false, stackFrameVariables: false, frameContextLines: 0},
    maxBreadcrumbs: 0,
    integrations: defaults => defaults.filter(integration => !['Breadcrumbs', 'Console', 'HttpContext', 'CultureContext', 'BrowserSession', 'ConversationId'].includes(integration.name)),
    enhanceFetchErrorMessages: false,
    release: `roamcroft@${GAME_VERSION}`,
    beforeSend(event, hint) {
      hint.attachments = [];
      return privateErrorEvent(event, `roamcroft@${GAME_VERSION}`);
    },
  });
}

export default function Home() {
  return <Launcher />;
}
