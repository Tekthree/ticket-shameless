'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/ui/icons';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';

interface TicketCountFixerProps {
  eventId: string;
  eventTitle: string;
}

interface TicketCounts {
  ticketsTotal: number;
  currentRemaining: number;
  calculatedRemaining: number;
  discrepancy: number;
}

export default function TicketCountFixer({ eventId, eventTitle }: TicketCountFixerProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [counts, setCounts] = useState<TicketCounts | null>(null);
  const [wasFixed, setWasFixed] = useState(false);
  
  const checkCounts = async () => {
    setIsChecking(true);
    try {
      const response = await fetch('/api/tickets/verify-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        toast.error(data.error || 'Failed to check ticket counts');
        return;
      }
      
      setCounts(data.counts);
      setWasFixed(false);
      
      if (data.counts.discrepancy === 0) {
        toast.success('Ticket counts are correct!');
      } else {
        toast.error(`Discrepancy found: ${data.counts.discrepancy} tickets`);
      }
    } catch (error) {
      toast.error('Error checking ticket counts');
      console.error(error);
    } finally {
      setIsChecking(false);
    }
  };
  
  const fixCounts = async () => {
    setIsFixing(true);
    try {
      const response = await fetch('/api/tickets/verify-counts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, fix: true }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        toast.error(data.error || 'Failed to fix ticket counts');
        return;
      }
      
      if (data.fixed) {
        setCounts(data.after);
        setWasFixed(true);
        toast.success('Ticket counts fixed successfully!');
      } else {
        toast.info('No fix needed');
      }
    } catch (error) {
      toast.error('Error fixing ticket counts');
      console.error(error);
    } finally {
      setIsFixing(false);
    }
  };
  
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Ticket Count Verification</CardTitle>
        <CardDescription>
          {eventTitle}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {counts ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="text-sm font-medium">Total tickets:</div>
              <div>{counts.ticketsTotal}</div>
              
              <div className="text-sm font-medium">Current remaining:</div>
              <div className="flex items-center">
                {counts.currentRemaining}
                {counts.discrepancy !== 0 && (
                  <Badge variant={wasFixed ? "outline" : "destructive"} className="ml-2">
                    {wasFixed ? "Fixed" : "Wrong"}
                  </Badge>
                )}
              </div>
              
              <div className="text-sm font-medium">Expected remaining:</div>
              <div>{counts.calculatedRemaining}</div>
              
              <div className="text-sm font-medium">Discrepancy:</div>
              <div className={counts.discrepancy !== 0 ? "text-red-500 font-bold" : ""}>
                {counts.discrepancy}
              </div>
            </div>
            
            {counts.discrepancy !== 0 && !wasFixed && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm">
                <strong>Warning:</strong> The current ticket count doesn't match the expected value.
                This could cause issues with ticket sales and inventory management.
              </div>
            )}
            
            {wasFixed && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md text-sm">
                <strong>Success:</strong> The ticket count has been corrected.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            Click "Check Counts" to verify ticket inventory
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkCounts} disabled={isChecking || isFixing}>
          {isChecking ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>Check Counts</>
          )}
        </Button>
        
        <Button 
          onClick={fixCounts} 
          disabled={isChecking || isFixing || !counts || counts.discrepancy === 0 || wasFixed}
        >
          {isFixing ? (
            <>
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              Fixing...
            </>
          ) : (
            <>Fix Counts</>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}