import type { Metadata } from 'next';
import Expedition from '@/components/gilded/Expedition';
export const metadata: Metadata = {
  title: 'The Gilded Circuit — Naturalis Futura',
  description: 'A small harbor mystery. Follow a courier with Pip, change what the town rewards, and bring dinner home.',
};
export default function ExpeditionPage() { return <Expedition />; }
