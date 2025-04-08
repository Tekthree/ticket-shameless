import TicketReports from '@/components/admin/TicketReports';
import { Toaster } from 'react-hot-toast';

export default function TicketReportsPage() {
  return (
    <div>
      <Toaster position="top-right" />
      <TicketReports />
    </div>
  );
}
