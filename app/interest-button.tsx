'use client';

import type { ReactNode } from 'react';
import { smoothScrollToElement } from './smooth-scroll';

type Props = { service: string; message: string; className?: string; children: ReactNode };

export default function InterestButton({ service, message, className, children }: Props) {
  return <button type="button" className={className} onClick={() => {
    window.dispatchEvent(new CustomEvent('interplus:program-selected', { detail: { service, message } }));
    smoothScrollToElement('#contact');
  }}>{children}</button>;
}
