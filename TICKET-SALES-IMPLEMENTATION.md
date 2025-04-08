# Ticket Sales Processing Implementation

This document provides instructions for deploying and using the new ticket sales processing system for Ticket Shameless.

## Overview

The ticket sales processing system adds the following capabilities to Ticket Shameless:

1. **Point of Sale (POS) Interface:** Process in-person ticket sales for events
2. **Ticket Scanning Interface:** Scan tickets at venue entry and track attendance
3. **Ticket Reporting Dashboard:** View comprehensive sales and scanning statistics

## Installation

### 1. Run Database Migrations

The first step is to apply the database migrations that create the necessary tables and views:

```bash
# From the project root directory
cd scripts
node run-migrations.js
```

This will create the following new database tables:
- `ticket_types`: Defines different ticket types for events
- `tickets`: Individual tickets associated with orders
- `ticket_transactions`: Audit trail of all ticket-related actions

### 2. Access the New Features

After migrations are applied, the following routes will be available:

- `/box-office`: Box Office dashboard with links to POS and scanning
- `/box-office/pos`: Point of Sale interface for selling tickets
- `/box-office/scanning`: Ticket scanning interface for event entry
- `/admin/tickets`: Ticket reporting dashboard

## User Guides

### Box Office Staff Guide

1. **Processing a Sale:**
   - Navigate to `/box-office/pos`
   - Select an event from the list
   - Choose ticket types and quantities
   - Enter customer information
   - Select payment method
   - Click "Complete Sale"
   - Print or email receipt as needed

2. **Scanning Tickets:**
   - Navigate to `/box-office/scanning`
   - Select the event
   - Use the scanning interface to scan ticket QR codes
   - View real-time scan statistics for the event

### Admin Guide

1. **Viewing Reports:**
   - Navigate to `/admin/tickets`
   - Three tabs are available:
     - **Events:** View scanning statistics by event
     - **Staff:** See sales performance by staff member
     - **Transactions:** Detailed transaction history by event
   - Export data to CSV for further analysis

## Role-Based Access

The system enforces the following access controls:

- **Admin:** Full access to all features, including reports
- **Event Manager:** Access to POS, scanning, and limited reports
- **Box Office:** Access to POS and scanning
- **Other roles:** No access to box office features

## Troubleshooting

- **Database Issues:** If you encounter database errors, verify migrations have been applied
- **Missing Ticket Types:** Default ticket types will be created if none exist for an event
- **QR Code Scanning:** For testing, you can manually enter QR codes in the scanning interface

## Future Enhancements

Planned enhancements for future releases:

1. Mobile app integration for scanning
2. Guest list management integration
3. Advanced reporting with charts and analytics
4. Multi-venue support
5. Integration with external ticket platforms

## Support

For issues or questions, please contact the development team.
