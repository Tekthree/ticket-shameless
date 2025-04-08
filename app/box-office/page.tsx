import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function BoxOfficeDashboard() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Box Office Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Point of Sale Card */}
        <Card>
          <CardHeader>
            <CardTitle>Point of Sale</CardTitle>
            <CardDescription>Process in-person ticket sales</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Sell tickets to customers in person. Process credit card or cash payments.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/box-office/pos">Open POS</Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Ticket Scanning Card */}
        <Card>
          <CardHeader>
            <CardTitle>Ticket Scanning</CardTitle>
            <CardDescription>Scan tickets at venue entry</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Scan ticket QR codes to validate entry. Track attendance in real-time.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/box-office/scanning">Scan Tickets</Link>
            </Button>
          </CardFooter>
        </Card>
        
        {/* Reports Card */}
        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>View sales and scanning data</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Access comprehensive reporting for all ticket sales and check-ins.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href="/admin/tickets">View Reports</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
