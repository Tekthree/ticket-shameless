import ScanningInterface from '@/components/box-office/ScanningInterface';
import { Toaster } from 'react-hot-toast';

export default function ScanningPage() {
  return (
    <div>
      <Toaster position="top-right" />
      <ScanningInterface />
    </div>
  );
}
