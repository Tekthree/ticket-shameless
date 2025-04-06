'use client';

import TicketHistory from '@/components/profile/TicketHistory';

export default function TicketsPage() {
  return (
    <div className="bg-white dark:bg-gray-900/50 p-8 rounded-lg border dark:border-gray-800 border-gray-200">
      <TicketHistory />
    </div>
  );
}
