# User Roles Implementation

This document outlines the user role system for the Ticket Shameless application, detailing the different roles, their permissions, and implementation details. It serves as the central reference for all role-based access control throughout the application.

## Role Overview

The Ticket Shameless application implements a comprehensive role-based access control system with the following user roles:

| Role | Description | Access Level |
|------|-------------|--------------|
| `admin` | Full system access for Shameless Productions staff | Complete access to all features and data |
| `event_manager` | Can create and manage events, view sales data | High access to event management features |
| `box_office` | Can process tickets, check-ins, and handle customer issues | Medium access focused on ticket operations |
| `artist` | Can view performance details and schedules | Limited access to performance information |
| `guest_list_manager` | Can add people to guest lists for specific events | Limited access to guest list management |
| `customer` | Regular users who purchase tickets | Basic access to ticket purchasing and account management |

## Database Schema

The role system is implemented using the following database tables:

### Roles Table

```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### User Roles Junction Table

```sql
CREATE TABLE user_roles (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, role_id)
);
```

## Role-Based Access Control

### Permission Checks

The application uses a custom hook `useUserRoles` to check user permissions throughout the application:

```typescript
// Example usage of the useUserRoles hook
const { 
  roles,
  hasRole, 
  isAdmin, 
  isEventManager, 
  isBoxOffice, 
  isArtist, 
  isGuestListManager, 
  isCustomer 
} = useUserRoles(userId);

// Check if user has a specific role (follows naming convention from implementation-sequence.md)
if (hasRole(userId, 'admin')) {
  // Allow admin-only actions
}

// Role-specific checks
if (isEventManager()) {
  // Show event management UI
}
```

### Row Level Security (RLS)

Supabase Row Level Security policies are implemented to enforce access control at the database level:

```sql
-- Example RLS policy for events table
CREATE POLICY "Public users can view published events" ON events
  FOR SELECT
  USING (is_published = true);

CREATE POLICY "Event managers can manage events" ON events
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT ur.user_id 
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      WHERE r.name IN ('admin', 'event_manager')
    )
  );
```

## Role-Based UI Components

The application conditionally renders UI components based on user roles:

```tsx
// Example of role-based UI rendering
const EventActions = () => {
  const { isAdmin, isEventManager } = useUserRoles();
  
  if (!isAdmin() && !isEventManager()) {
    return null;
  }
  
  return (
    <div className="event-actions">
      <Button>Edit Event</Button>
      <Button>Manage Tickets</Button>
    </div>
  );
};
```

## Role Assignment

### Default Role Assignment

New users are automatically assigned the `customer` role upon registration:

```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a profile entry
  INSERT INTO profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Assign customer role to new users
  INSERT INTO user_roles (user_id, role_id)
  SELECT NEW.id, r.id
  FROM roles r
  WHERE r.name = 'customer';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Admin Role Assignment

Admin roles can only be assigned by existing administrators through the admin interface:

```typescript
async function assignRole(userId: string, roleName: string) {
  const { data, error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: await getRoleIdByName(roleName)
    });
    
  if (error) {
    throw new Error(`Failed to assign role: ${error.message}`);
  }
  
  return data;
}
```

## Role-Based Access Middleware

The application implements middleware to protect routes based on user roles, as mentioned in the features.md document under "Security" section:

```typescript
// Example middleware for role-based route protection
export function withRoleProtection(allowedRoles: string[]) {
  return async (req: NextRequest, res: NextResponse) => {
    const supabase = createServerSupabaseClient({ req, res });
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect('/auth/login');
    }
    
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('roles:role_id(name)')
      .eq('user_id', user.id);
      
    const hasAllowedRole = userRoles.some(ur => 
      allowedRoles.includes(ur.roles.name)
    );
    
    if (!hasAllowedRole) {
      return NextResponse.redirect('/unauthorized');
    }
    
    return NextResponse.next();
  };
}

// Usage in route handlers
export const GET = withRoleProtection(['admin', 'event_manager'])(
  async (req) => {
    // Route handler implementation
  }
);
```

This middleware works in conjunction with the Row Level Security policies to provide comprehensive protection at both the API and database levels, ensuring consistent access control throughout the application.


## Role-Specific Features

### Admin Features

- Complete access to all system functions
- User management (create, edit, delete users)
- Role assignment and management
- System configuration
- Access to all reports and analytics
- Content management for the entire site

### Event Manager Features

- Create and manage events
- Configure ticket types and pricing
- View sales reports and analytics
- Manage event details and schedules
- Access to event-specific guest lists

### Box Office Features

- Process ticket sales and refunds
- Check-in attendees at events
- Handle customer service issues
- View event details and ticket availability
- Process walk-up ticket sales

### Artist Features

- View performance schedules
- Access artist-specific information
- View guest list for their performances
- Access backstage information

### Guest List Manager Features

- Add and remove people from guest lists
- Check in guest list attendees
- View guest list reports

### Customer Features

- Purchase tickets
- View order history
- Manage account details
- View upcoming events
- Access purchased tickets

## UI Implementation

The UI adapts based on user roles:

1. **Navigation**: Different navigation options appear based on user role
2. **Action Buttons**: Only show actions the user has permission to perform
3. **Admin Dashboard**: Only accessible to users with admin role
4. **Event Management**: Only visible to admin and event manager roles

## Testing Role-Based Access

To test the role-based access system:

1. Create test users with different roles
2. Attempt to access various features with each user
3. Verify that permissions are correctly enforced
4. Test edge cases like users with multiple roles

## Integration with Ticket Inventory Management

The role-based access control system integrates directly with the centralized ticket inventory management system to ensure proper permissions for all inventory operations:

### Role-Based Inventory Access

| Role | Inventory Permissions |
|------|----------------------|
| `admin` | Full access to increase inventory, view audit logs, manage all ticket types |
| `event_manager` | Can increase inventory for their events, view sales data, manage ticket types |
| `box_office` | Can view available tickets, process sales, and handle reservations |
| `guest_list_manager` | Can allocate guest list tickets from designated inventory |
| `customer` | Can only view available ticket counts and purchase tickets |

### Security for Inventory Functions

All inventory management functions include role checks to prevent unauthorized access:

```typescript
// Example of role-based security in inventory functions
async function increaseTicketInventory(ticketTypeId: string, quantity: number) {
  const user = await getAuthenticatedUser();
  const { hasRole } = useUserRoles(user.id);
  
  // Only admins and event managers can increase inventory
  if (!hasRole(user.id, 'admin') && !hasRole(user.id, 'event_manager')) {
    throw new Error('Permission denied: Insufficient privileges to modify inventory');
  }
  
  // Proceed with inventory increase and audit logging
  // ...
}
```

### Audit Trail with User Role Context

The inventory audit log captures the user's role along with their actions for comprehensive tracking:

```typescript
async function logInventoryChange(ticketTypeId: string, changeType: string, previousValue: number, newValue: number) {
  const user = await getAuthenticatedUser();
  const { roles } = useUserRoles(user.id);
  
  await supabase.from('inventory_audit_log').insert({
    ticket_type_id: ticketTypeId,
    user_id: user.id,
    user_role: roles[0]?.name || 'unknown', // Primary role of the user
    change_type: changeType,
    previous_value: previousValue,
    new_value: newValue,
    timestamp: new Date().toISOString()
  });
}
```

## Implementation Steps

1. Set up the database tables for roles and user_roles
2. Implement the useUserRoles hook for client-side role checks
3. Configure RLS policies for database-level security
4. Implement middleware for route protection
5. Create role-specific UI components and views
6. Set up role assignment functionality in the admin interface
7. Integrate role checks with the ticket inventory management system
8. Test the complete role system with various user scenarios

By following this implementation guide, the Ticket Shameless application will have a robust role-based access control system that ensures users can only access features appropriate to their role.
