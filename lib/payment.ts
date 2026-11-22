'use client';

import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './supabase';

/** Payment details shown on purchase pages. Managed by admins in Payment → ตั้งค่าการชำระเงิน (table payment_settings). */
export type PaymentSettings = { promptpay_id: string; account_name: string; bank_name: string; account_number: string };

/** Fallback from env vars, used only until the database row loads or if it is missing. */
const envFallback: PaymentSettings = {
  promptpay_id: (process.env.NEXT_PUBLIC_PROMPTPAY ?? '').replace(/\D/g, ''),
  account_name: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NAME ?? '',
  bank_name: process.env.NEXT_PUBLIC_BANK_NAME ?? '',
  account_number: process.env.NEXT_PUBLIC_BANK_ACCOUNT_NUMBER ?? '',
};

export function hasAnyPayment(settings: PaymentSettings): boolean {
  return Boolean(settings.promptpay_id || settings.account_number);
}

export function usePaymentSettings(): { ready: boolean; settings: PaymentSettings } {
  const [state, setState] = useState<{ ready: boolean; settings: PaymentSettings }>({ ready: !isSupabaseConfigured, settings: envFallback });
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    supabase().from('payment_settings').select('promptpay_id, account_name, bank_name, account_number').eq('id', 1).maybeSingle()
      .then(({ data }) => setState({ ready: true, settings: (data as PaymentSettings | null) ?? envFallback }));
  }, []);
  return state;
}
