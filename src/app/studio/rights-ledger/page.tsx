import type { Metadata } from 'next';
import { RightsPassportLedger } from '@/components/rights-passport-ledger';
import { rightsPassportRegistry } from '@/lib/rights-passports';

export const metadata: Metadata = {
  title: '权利护照台账｜Handx web0.1',
  description: '站主本机使用的逐项权利、复用范围与媒体门禁台账；未知权利默认阻断。',
};

export default function RightsPassportLedgerPage() {
  return <RightsPassportLedger registry={rightsPassportRegistry} />;
}
