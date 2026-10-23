'use client';

import { Suspense } from 'react';
import { SerwistProvider } from '@serwist/turbopack/react';
import { AuthProvider } from './AuthProvider';
import { AnalyticsTracker } from './AnalyticsTracker';
import OfflineBanner from '../OfflineBanner';
import RegionBlockListener from './RegionBlockListener';
import { ContenedorAvisos } from './avisos/ContenedorAvisos';
import ModalLimite from './avisos/ModalLimite';

export default function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SerwistProvider swUrl="/serwist/sw.js">
      <RegionBlockListener />
      <OfflineBanner />

      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>

      <AuthProvider>
        {children}
        <ModalLimite />
      </AuthProvider>

      <Suspense fallback={null}>
        <ContenedorAvisos />
      </Suspense>
    </SerwistProvider>
  );
}