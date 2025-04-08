'use client';

import { useState, useEffect, useRef } from 'react';
import { useTicketScanner, ScanResult, ScanStats } from '@/hooks/box-office/useTicketScanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
}

export default function ScanningInterface() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [scanStats, setScanStats] = useState<ScanStats>({ total: 0, scanned: 0, percentage: 0 });
  const [ticketCode, setTicketCode] = useState('');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  
  const ticketInputRef = useRef<HTMLInputElement>(null);
  const { isLoading, error, fetchEvents, getScanStats, scanTicket } = useTicketScanner();

  // Fetch events on component mount
  useEffect(() => {
    async function loadEvents() {
      const { events: fetchedEvents } = await fetchEvents();
      setEvents(fetchedEvents);
    }
    
    loadEvents();
  }, []);

  // Update scan stats when event is selected
  useEffect(() => {
    async function loadScanStats() {
      if (selectedEvent) {
        const stats = await getScanStats(selectedEvent.id);
        setScanStats(stats);
      }
    }
    
    if (selectedEvent) {
      loadScanStats();
    }
  }, [selectedEvent]);

  // Focus input field when result is displayed
  useEffect(() => {
    if (scanResult && ticketInputRef.current) {
      setTimeout(() => {
        ticketInputRef.current?.focus();
      }, 500);
    }
  }, [scanResult]);

  // Handle scanning
  const handleScanTicket = async () => {
    if (!selectedEvent || !ticketCode.trim()) {
      toast.error('Please select an event and enter a ticket code');
      return;
    }
    
    setScanResult(null);
    
    try {
      const result = await scanTicket(selectedEvent.id, ticketCode.trim());
      setScanResult(result);
      
      if (result.success) {
        toast.success('Ticket successfully scanned');
        // Update stats
        const updatedStats = await getScanStats(selectedEvent.id);
        setScanStats(updatedStats);
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      toast.error('Error scanning ticket');
    }
    
    // Clear the input
    setTicketCode('');
  };

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Ticket Scanning</h1>
      
      {/* Event selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.map(event => (
              <Button 
                key={event.id}
                variant={selectedEvent?.id === event.id ? "default" : "outline"}
                className="h-auto p-4 justify-start"
                onClick={() => setSelectedEvent(event)}
              >
                <div className="text-left">
                  <div className="font-medium">{event.title}</div>
                  <div className="text-sm opacity-70">
                    {new Date(event.date).toLocaleDateString()} - {event.time}
                  </div>
                  <div className="text-sm opacity-70">{event.venue}</div>
                </div>
              </Button>
            ))}
            
            {events.length === 0 && !isLoading && (
              <div className="col-span-full p-4 text-center text-gray-500">
                No upcoming events found
              </div>
            )}
            
            {isLoading && (
              <div className="col-span-full p-4 text-center text-gray-500">
                Loading events...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {selectedEvent && (
        <>
          {/* Scan stats */}
          <Card className="mb-6 bg-gray-50">
            <CardHeader>
              <CardTitle>Scanning Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-2">
                <div>
                  <div className="text-2xl font-bold">{scanStats.scanned} / {scanStats.total}</div>
                  <div className="text-sm text-gray-500">Tickets Scanned</div>
                </div>
                <div className="text-3xl font-bold">{scanStats.percentage}%</div>
              </div>
              <Progress value={scanStats.percentage} className="h-2" />
            </CardContent>
          </Card>
          
          {/* Scanning interface */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Scan Ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-2">
                <Input
                  ref={ticketInputRef}
                  type="text"
                  value={ticketCode}
                  onChange={(e) => setTicketCode(e.target.value)}
                  placeholder="Enter ticket code or scan QR"
                  className="flex-1"
                  onKeyDown={(e) => e.key === 'Enter' && handleScanTicket()}
                  autoFocus
                />
                <Button 
                  onClick={handleScanTicket}
                  disabled={isLoading || !ticketCode.trim()}
                >
                  {isLoading ? 'Scanning...' : 'Scan'}
                </Button>
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                Scan QR code or enter ticket code manually, then press Enter or click Scan
              </div>
            </CardContent>
          </Card>
          
          {/* Scan result */}
          {scanResult && (
            <Card className={`mb-6 ${scanResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              <CardHeader>
                <CardTitle>{scanResult.success ? 'Valid Ticket' : 'Invalid Ticket'}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-2">{scanResult.message}</p>
                
                {scanResult.data && (
                  <div className="mt-2 p-4 bg-white rounded-md">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium">Ticket Type:</div>
                      <div>{scanResult.data.ticket_types?.name || 'Unknown'}</div>
                      
                      <div className="text-sm font-medium">Customer:</div>
                      <div>{scanResult.data.orders?.customer_name || 'Unknown'}</div>
                      
                      <div className="text-sm font-medium">Email:</div>
                      <div>{scanResult.data.orders?.customer_email || 'Unknown'}</div>
                      
                      <div className="text-sm font-medium">Order ID:</div>
                      <div>{scanResult.data.order_id || 'Unknown'}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
