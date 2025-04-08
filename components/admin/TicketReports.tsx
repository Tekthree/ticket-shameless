'use client';

import { useState, useEffect } from 'react';
import { useTicketReports, EventScanStats, StaffSaleStats, TicketTransaction } from '@/hooks/useTicketReports';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { toast } from 'react-hot-toast';

export default function TicketReports() {
  const [eventStats, setEventStats] = useState<EventScanStats[]>([]);
  const [staffStats, setStaffStats] = useState<StaffSaleStats[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TicketTransaction[]>([]);
  
  const { 
    isLoading, 
    error, 
    getEventStats, 
    getStaffStats, 
    getEventTransactions,
    exportEventDataToCsv,
    exportStaffDataToCsv,
    exportTransactionsToCsv
  } = useTicketReports();

  // Load event stats
  useEffect(() => {
    async function loadEventStats() {
      const { eventStats: stats } = await getEventStats();
      setEventStats(stats);
    }
    
    loadEventStats();
  }, []);

  // Load staff stats
  useEffect(() => {
    async function loadStaffStats() {
      const { staffStats: stats } = await getStaffStats();
      setStaffStats(stats);
    }
    
    loadStaffStats();
  }, []);

  // Load transactions when event is selected
  useEffect(() => {
    async function loadTransactions() {
      if (selectedEvent) {
        const { transactions: txs } = await getEventTransactions(selectedEvent);
        setTransactions(txs);
      }
    }
    
    if (selectedEvent) {
      loadTransactions();
    } else {
      setTransactions([]);
    }
  }, [selectedEvent]);

  const handleExportEvents = () => {
    try {
      exportEventDataToCsv(eventStats);
      toast.success('Event data exported to CSV');
    } catch (err) {
      toast.error('Failed to export event data');
    }
  };

  const handleExportStaff = () => {
    try {
      exportStaffDataToCsv(staffStats);
      toast.success('Staff data exported to CSV');
    } catch (err) {
      toast.error('Failed to export staff data');
    }
  };

  const handleExportTransactions = () => {
    if (!selectedEvent) {
      toast.error('Please select an event first');
      return;
    }
    
    try {
      exportTransactionsToCsv(transactions);
      toast.success('Transaction data exported to CSV');
    } catch (err) {
      toast.error('Failed to export transaction data');
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Ticket Reports</h1>
      
      <Tabs defaultValue="events">
        <TabsList className="mb-6">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="staff">Staff Performance</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="events">
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Event Scanning Status</CardTitle>
              <Button variant="outline" onClick={handleExportEvents} disabled={eventStats.length === 0}>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center p-4">Loading event data...</div>
              ) : eventStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total Tickets</TableHead>
                      <TableHead className="text-right">Scanned</TableHead>
                      <TableHead className="text-right">Percentage</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventStats.map(event => (
                      <TableRow key={event.event_id}>
                        <TableCell>{event.event_name}</TableCell>
                        <TableCell>
                          {new Date(event.event_date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">{event.total_tickets}</TableCell>
                        <TableCell className="text-right">{event.scanned_tickets}</TableCell>
                        <TableCell className="text-right">{event.scan_percentage}%</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="link"
                            onClick={() => setSelectedEvent(event.event_id)}
                          >
                            View Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4 text-gray-500">
                  No event data available. Make sure you have created events and sold tickets.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="staff">
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Staff Sales Performance</CardTitle>
              <Button variant="outline" onClick={handleExportStaff} disabled={staffStats.length === 0}>
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center p-4">Loading staff data...</div>
              ) : staffStats.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Staff Member</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Tickets Sold</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                      <TableHead>Last Transaction</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staffStats.map(staff => (
                      <TableRow key={staff.staff_id}>
                        <TableCell>{staff.staff_name || 'Unknown'}</TableCell>
                        <TableCell className="text-right">{staff.transactions_processed}</TableCell>
                        <TableCell className="text-right">{staff.tickets_sold}</TableCell>
                        <TableCell className="text-right">
                          ${(staff.total_sales / 100).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {staff.last_transaction ? 
                            new Date(staff.last_transaction).toLocaleString() : 
                            'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4 text-gray-500">
                  No staff sales data available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card className="mb-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Transaction History</CardTitle>
              <Button 
                variant="outline" 
                onClick={handleExportTransactions} 
                disabled={!selectedEvent || transactions.length === 0}
              >
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {!selectedEvent ? (
                <div className="text-center p-6 bg-gray-50 rounded">
                  <p>Select an event from the Events tab to view its transactions</p>
                </div>
              ) : isLoading ? (
                <div className="text-center p-4">Loading transaction data...</div>
              ) : transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map(transaction => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.created_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded text-sm ${
                            transaction.action === 'sale' ? 'bg-green-100' :
                            transaction.action === 'scan' ? 'bg-blue-100' :
                            transaction.action === 'refund' ? 'bg-red-100' :
                            'bg-gray-100'
                          }`}>
                            {transaction.action}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.profiles?.display_name || 'Unknown'}</TableCell>
                        <TableCell>{transaction.location || 'Unknown'}</TableCell>
                        <TableCell>{transaction.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4 text-gray-500">
                  No transactions found for this event.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
