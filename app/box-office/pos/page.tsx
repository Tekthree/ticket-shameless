import POSInterface from '@/components/box-office/POSInterface';
import { Toaster } from 'react-hot-toast';

export default function POSPage() {
  return (
    <div>
      <Toaster position="top-right" />
      <POSInterface />
    </div>
  );
}
