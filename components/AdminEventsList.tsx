'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Event } from '@/lib/events'
import { formatDate } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { useToast } from '@/components/ui/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

interface AdminEventsListProps {
  events: Event[]
}

export default function AdminEventsList({ events }: AdminEventsListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<string | null>(null)
  
  // Filter events based on search term
  const filteredEvents = events.filter(event => 
    event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    event.venue.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  const confirmDelete = (id: string) => {
    setEventToDelete(id)
    setDeleteConfirmOpen(true)
  }
  
  const handleDelete = async () => {
    if (!eventToDelete) return
    
    setIsDeleting(eventToDelete)
    setDeleteConfirmOpen(false)
    
    try {
      const response = await fetch(`/api/events/${eventToDelete}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete event')
      }
      
      toast({
        title: "Success",
        description: "Event deleted successfully",
        variant: "success"
      })
      router.refresh()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
      console.error('Error deleting event:', error)
    } finally {
      setIsDeleting(null)
      setEventToDelete(null)
    }
  }
  
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        {searchTerm && (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSearchTerm('')}
            className="h-10 w-10"
          >
            <Icons.close className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>
      
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <div className="flex flex-col items-center justify-center">
            <Icons.calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No events found</h3>
            <p className="text-sm text-muted-foreground mt-2">
              {searchTerm 
                ? `No events match the search "${searchTerm}"`
                : "Start by creating your first event"
              }
            </p>
            {!searchTerm && (
              <Button asChild className="mt-4" variant="shameless">
                <Link href="/admin/events/new">
                  <Icons.add className="mr-2 h-4 w-4" />
                  Create Event
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Tickets</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEvents.map((event) => (
                <TableRow key={event.id}>
                  <TableCell className="font-medium">
                    <div>{event.title}</div>
                    <div className="text-sm text-muted-foreground">{event.slug}</div>
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(event.date)}</div>
                    <div className="text-sm text-muted-foreground">{event.time}</div>
                  </TableCell>
                  <TableCell>
                    <div>{event.venue}</div>
                  </TableCell>
                  <TableCell>${event.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>{event.ticketsRemaining} / {event.ticketsTotal}</div>
                      {event.soldOut ? (
                        <Badge variant="destructive">Sold Out</Badge>
                      ) : (
                        <Badge variant="secondary">Available</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/events/${event.slug}`} target="_blank">
                          <Icons.eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/admin/events/${event.id}`}>
                          <Icons.edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button
                        onClick={() => confirmDelete(event.id)}
                        disabled={isDeleting === event.id}
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive/10"
                      >
                        {isDeleting === event.id ? (
                          <>
                            <Icons.spinner className="h-4 w-4 mr-1 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Icons.trash className="h-4 w-4 mr-1" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this event?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the event
              and remove all associated data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
