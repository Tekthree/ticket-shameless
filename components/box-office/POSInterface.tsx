'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useBoxOffice, Event, TicketType } from '@/hooks/box-office/useBoxOffice';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { toast } from 'react-hot-toast';

export default function POSInterface() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<{[key: string]: number}>({});
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [location, setLocation] = useState('main_booth');
  
  const router = useRouter();
  const { profile } = useUserProfile();
  const { 
    isLoading, 
    error, 
    fetchEvents, 
    fetchTicketTypes, 
    createDefaultTicketTypes,
    processSale 
  } = useBoxOffice();

  // Fetch events on component mount
  useEffect(() => {
    async function loadEvents() {
      const { events: fetchedEvents } = await fetchEvents();
      setEvents(fetchedEvents);
    }
    
    loadEvents();
  }, []);

  // Fetch ticket types when event is selected
  useEffect(() => {
    async function loadTicketTypes() {
      if (selectedEvent) {
        const { ticketTypes: fetchedTypes } = await fetchTicketTypes(selectedEvent.id);
        
        if (fetchedTypes.length === 0) {
          toast('Creating default ticket types for this event...', { icon: 'ℹ️' });
          const { ticketTypes: createdTypes } = await createDefaultTicketTypes(selectedEvent.id);
          setTicketTypes(createdTypes);
        } else {
          setTicketTypes(fetchedTypes);
        }
      }
    }
    
    if (selectedEvent) {
      loadTicketTypes();
    }
  }, [selectedEvent]);

  // Handle ticket selection
  const handleTicketChange = (ticketTypeId: string, quantity: number) => {
    setSelectedTickets({
      ...selectedTickets,
      [ticketTypeId]: quantity
    });
  };

  // Calculate total price
  const calculateTotal = () => {
    return ticketTypes.reduce((total, type) => {
      const quantity = selectedTickets[type.id] || 0;
      return total + (type.price * quantity);
    }, 0);
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      selectedEvent && 
      customerEmail && 
      customerEmail.includes('@') && 
      customerName && 
      calculateTotal() > 0
    );
  };

  // Process sale
  const handleProcessSale = async () => {
    if (!isFormValid()) {
      toast.error('Please fill out all required fields');
      return;
    }
    
    if (!selectedEvent) return;
    
    try {
      const result = await processSale({
        eventId: selectedEvent.id,
        customerEmail,
        customerName,
        paymentMethod,
        location,
        selectedTickets
      });
      
      if (result.success) {
        toast.success('Sale completed successfully!');
        router.push(`/box-office/confirmation/${result.orderId}`);
      } else {
        // Display a more detailed error message
        toast.error(`Failed to process sale: ${result.error || 'Unknown error'}`, { duration: 5000 });
        console.error('Sale processing error:', result.error);
      }
    } catch (err) {
      console.error('Exception during sale processing:', err);
      toast.error(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`, { duration: 5000 });
    }
  };

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Box Office - Point of Sale</h1>
      
      {/* Event selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          {/* Ticket selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Select Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              {ticketTypes.length > 0 ? (
                <div className="space-y-4">
                  {ticketTypes.map(type => (
                    <div key={type.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">{type.name}</div>
                        {type.description && (
                          <div className="text-sm opacity-70">{type.description}</div>
                        )}
                        <div className="text-sm">${(type.price / 100).toFixed(2)}</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTicketChange(
                            type.id, 
                            Math.max(0, (selectedTickets[type.id] || 0) - 1)
                          )}
                        >
                          -
                        </Button>
                        <span className="w-8 text-center">
                          {selectedTickets[type.id] || 0}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleTicketChange(
                            type.id, 
                            (selectedTickets[type.id] || 0) + 1
                          )}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-4 border-t">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total:</span>
                      <span>${(calculateTotal() / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  {isLoading ? 'Loading ticket types...' : 'No ticket types available'}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Customer Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Name</Label>
                    <Input 
                      id="customerName" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Customer Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerEmail">Email</Label>
                    <Input 
                      id="customerEmail" 
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="customer@example.com"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Method */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={paymentMethod}
                onValueChange={setPaymentMethod}
                className="flex flex-col space-y-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="credit_card" id="creditCard" />
                  <Label htmlFor="creditCard">Credit Card</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash">Cash</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comp" id="comp" />
                  <Label htmlFor="comp">Comp (Free)</Label>
                </div>
              </RadioGroup>
              
              <div className="mt-4">
                <Label htmlFor="location">Processing Location</Label>
                <Input 
                  id="location" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Box Office Location"
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>
          
          {/* Submit Button */}
          <Button 
            className="w-full py-6 text-lg" 
            disabled={!isFormValid() || isLoading}
            onClick={handleProcessSale}
          >
            {isLoading ? 'Processing...' : 'Complete Sale'}
          </Button>
        </>
      )}
    </div>
  );
}
