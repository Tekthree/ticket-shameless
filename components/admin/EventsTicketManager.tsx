'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TicketCountFixer from '@/components/admin/TicketCountFixer';

interface Event {
  id: string;
  title: string;
  date: string;
  tickets_total: number;
  tickets_remaining: number;
  sold_out: boolean;
}

interface FixResult {
  event_id: string;
  event_title: string;
  old_remaining: number;
  new_remaining: number;
  fixed: boolean;
}

interface EventsTicketManagerProps {
  events: Event[];
  fixResults: FixResult[];
}

export default function EventsTicketManager({ events, fixResults }: EventsTicketManagerProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  
  // Filter events that need fixing based on the results
  const eventsNeedingFix = fixResults?.filter(event => event.fixed) || [];
  const eventIds = new Set(eventsNeedingFix.map(event => event.event_id));
  
  const openDialog = (eventId: string) => {
    setSelectedEventId(eventId);
  };
  
  const closeDialog = () => {
    setSelectedEventId(null);
  };
  
  return (
    <div>
      <Tabs defaultValue="issues" className="w-full">
        <TabsList>
          <TabsTrigger value="issues">
            Issues
            {eventsNeedingFix.length > 0 && (
              <span className="ml-2 bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs font-medium">
                {eventsNeedingFix.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all-events">All Events</TabsTrigger>
        </TabsList>
        
        <TabsContent value="issues">
          {eventsNeedingFix.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
              {eventsNeedingFix.map((event) => (
                <Card key={event.event_id} className="bg-red-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="truncate">{event.event_title}</span>
                    </CardTitle>
                    <CardDescription>
                      Discrepancy: {event.old_remaining - event.new_remaining} tickets
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TicketCountFixer 
                      eventId={event.event_id} 
                      eventTitle={event.event_title}
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <h3 className="text-2xl font-semibold text-green-600 mb-2">All Good!</h3>
              <p className="text-muted-foreground">
                No events with ticket count issues were found.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all-events">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {events?.map((event) => (
              <Card 
                key={event.id} 
                className={eventIds.has(event.id) ? "bg-red-50 border-red-200" : ""}
              >
                <CardHeader>
                  <CardTitle className="truncate">{event.title}</CardTitle>
                  <CardDescription>
                    {new Date(event.date).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 mb-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-sm font-medium">Total:</div>
                      <div>{event.tickets_total}</div>
                      
                      <div className="text-sm font-medium">Remaining:</div>
                      <div className={eventIds.has(event.id) ? "text-red-500 font-bold" : ""}>
                        {event.tickets_remaining}
                      </div>
                      
                      <div className="text-sm font-medium">Status:</div>
                      <div>
                        {event.sold_out 
                          ? <span className="text-red-500 font-medium">Sold Out</span>
                          : <span className="text-green-600 font-medium">Available</span>
                        }
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => openDialog(event.id)}
                  >
                    Manage Tickets
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Modal dialog for the selected event */}
      {selectedEventId && events && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-background rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">
              {events.find(e => e.id === selectedEventId)?.title}
            </h3>
            <TicketCountFixer 
              eventId={selectedEventId} 
              eventTitle={events.find(e => e.id === selectedEventId)?.title || 'Event'} 
            />
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                onClick={closeDialog}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}