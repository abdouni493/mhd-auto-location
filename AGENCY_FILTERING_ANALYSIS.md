# Agency ID Filtering & Worker Authentication - Complete Analysis

## Overview
This document maps how agency_id filtering is implemented across the codebase and how workers are authenticated. The system uses a dual authentication model: Supabase Auth for admin users and a custom RPC function for worker authentication.

---

## 1. USER'S AGENCY RETRIEVAL

### 1.1 Admin Users (Supabase Auth)
**Location**: [src/components/DocumentRenderer.tsx](src/components/DocumentRenderer.tsx#L95-L105)

```tsx
// Get current user's agency from profiles table
const { data: userData } = await supabase.auth.getUser();
const { data: userProfile } = await supabase
  .from('profiles')
  .select('agency_id')
  .eq('id', userData?.user?.id)
  .single();

const currentAgencyId = userProfile?.agency_id || '';
setAgencyId(currentAgencyId);
```

**Source**: Users authenticated with Supabase have their `agency_id` stored in the `profiles` table.

### 1.2 Worker Users (Custom Auth)
**Location**: [src/components/Login.tsx](src/components/Login.tsx#L227-L270)

Worker authentication uses the `login_worker` RPC function (see [supabase-setup.sql](supabase-setup.sql#L300-L335)):

```typescript
const { data: loginResult, error: loginError } = await supabase.rpc('login_worker', {
  p_email_or_username: credential,
  p_password: password
});

if (loginResult.success && loginResult.worker) {
  const worker = loginResult.worker;
  const workerRole = (worker.type as UserRole) || 'worker';
  
  onLogin({
    name: worker.full_name,
    email: worker.email || '',
    role: workerRole,
  });
}
```

**Issue**: Workers are NOT linked to an agency in the current schema.

---

## 2. WORKERS TABLE SCHEMA

### Current Schema
**Location**: [supabase-setup.sql](supabase-setup.sql#L73-L90) & [workers_full_sql_setup.sql](workers_full_sql_setup.sql#L11-L30)

```sql
CREATE TABLE IF NOT EXISTS workers (
  id TEXT PRIMARY KEY,                    -- or UUID
  full_name TEXT NOT NULL,
  date_of_birth DATE,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  profile_photo TEXT,
  type TEXT NOT NULL CHECK (type IN ('admin', 'worker', 'driver')),
  payment_type TEXT CHECK (payment_type IN ('daily', 'monthly')),
  base_salary INTEGER NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- ❌ NO agency_id field!
);
```

### Missing Field
The `workers` table is **NOT** linked to the `agencies` table. There is no `agency_id` foreign key column.

**Comparison with profiles table** (used by admin users):
```sql
-- profiles table has:
- id (uuid, references auth.users)
- agency_id (uuid, references agencies)  ✓ Admin users have this
- role (text)
```

---

## 3. AGENCY_ID FILTERING IN QUERIES

### 3.1 TemplateService - Document Templates
**Location**: [src/services/TemplateService.ts](src/services/TemplateService.ts)

Multiple query patterns for filtering by agency:

#### Pattern 1: Get all templates for a type and agency
```typescript
// Line 53-61
static async getTemplatesByType(
  documentType: DocumentType,
  agencyId: string
): Promise<DocumentTemplateRow[]> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('template_type', documentType)
    .eq('agency_id', agencyId)        // ← agency_id filter
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
```

#### Pattern 2: Get default template
```typescript
// Line 68-83
static async getDefaultTemplate(
  documentType: DocumentType,
  agencyId: string
): Promise<DocumentTemplateRow> {
  const { data, error } = await supabase
    .from('document_templates')
    .select('*')
    .eq('template_type', documentType)
    .eq('agency_id', agencyId)        // ← agency_id filter
    .eq('is_default', true)
    .single();
```

#### Pattern 3: Save template with agency
```typescript
// Line 104-117
static async saveTemplate(
  documentType: DocumentType,
  agencyId: string,
  name: string,
  template: { html: string; styles?: any },
  isDefault: boolean = false,
  hasConditions: boolean = false
): Promise<DocumentTemplateRow> {
  const { data, error } = await supabase
    .from('document_templates')
    .insert({
      agency_id: agencyId,            // ← set agency_id
      template_type: documentType,
```

### 3.2 DocumentTemplateService
**Location**: [src/services/DocumentTemplateService.ts](src/services/DocumentTemplateService.ts#L38-L45)

```typescript
static async getSavedTemplates(
  documentType: DocumentType,
  agencyId?: string
): Promise<SavedDocumentTemplate[]> {
  let query = supabase
    .from('document_templates')
    .select('*')
    .eq('template_type', documentType);

  if (agencyId) {
    query = query.eq('agency_id', agencyId);    // ← conditional agency filter
  }

  const { data, error } = await query.order('created_at', { ascending: false });
```

### 3.3 PrintService_v2
**Location**: [src/services/PrintService_v2.ts](src/services/PrintService_v2.ts#L28-L52)

```typescript
static async printDocument(
  documentType: DocumentType,
  agencyId: string,                   // ← takes agencyId parameter
  data: Record<string, any>,
  selectedTemplateId?: string
): Promise<void> {
  // Passes agencyId to template service
  template = await TemplateService.getDefaultTemplate(documentType, agencyId);
  const finalHtml = await ConditionsService.buildCompleteDocument(
    template,
    data,
    agencyId
  );
```

---

## 4. COMPLETE WORKER AUTHENTICATION FLOW

### Step 1: Worker Login Form
**Location**: [src/components/Login.tsx](src/components/Login.tsx#L227-L240)

```typescript
// Detect username vs email
const hasAtSymbol = credential.includes('@');

if (!hasAtSymbol) {
  console.log('[Login] Username detected, attempting worker login via RPC');
  
  // Call worker login function
  const { data: loginResult, error: loginError } = await supabase.rpc('login_worker', {
    p_email_or_username: credential,
    p_password: password
  });
```

### Step 2: Database RPC Function
**Location**: [supabase-setup.sql](supabase-setup.sql#L300-L335)

```sql
CREATE OR REPLACE FUNCTION login_worker(p_email_or_username TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
    worker_record RECORD;
BEGIN
    -- Try to find worker by email first
    SELECT * INTO worker_record
    FROM workers
    WHERE email = p_email_or_username AND password = p_password;

    -- If not found by email, try by username
    IF worker_record IS NULL THEN
        SELECT * INTO worker_record
        FROM workers
        WHERE username = p_email_or_username AND password = p_password;
    END IF;

    -- If worker found, return success with worker data
    IF worker_record IS NOT NULL THEN
        RETURN json_build_object(
            'success', true,
            'worker', json_build_object(
                'id', worker_record.id,
                'full_name', worker_record.full_name,
                'email', worker_record.email,
                'username', worker_record.username,
                'type', worker_record.type,                  -- admin, worker, driver
                'profile_photo', worker_record.profile_photo,
                'password', worker_record.password
            )
        );
    END IF;

    -- If no worker found, return failure
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Step 3: Handle Login Response
**Location**: [src/components/Login.tsx](src/components/Login.tsx#L252-L270)

```typescript
if (loginResult.success && loginResult.worker) {
  const worker = loginResult.worker;
  const workerRole = (worker.type as UserRole) || 'worker';
  
  console.log('[Login] === WORKER AUTH SUCCESSFUL ===');
  console.log('[Login] Worker login user:', { 
    name: worker.full_name, 
    email: worker.email, 
    role: workerRole 
  });
  
  // Clear form
  setEmail('');
  setPassword('');
  setUsername('');
  
  // Emit user object
  onLogin({
    name: worker.full_name,
    email: worker.email || '',
    role: workerRole,
  });
}
```

### Step 4: Session Management
**Location**: [src/App.tsx](src/App.tsx#L268-L345)

```typescript
// Session restoration on app mount
const restoreSession = async () => {
  console.log('\n[Auth] ======= SESSION RESTORATION STARTED =======');
  
  try {
    // Initialize session using session service
    const session = await sessionService.initializeSession();
    
    if (!session) {
      console.log('[Auth] === No session found ===');
      setIsAuthLoading(false);
      return;
    }
    
    // Session restored
    console.log('[Auth] === Session restored from database ===');
    console.log('[Auth] User:', session.name, 'Role:', session.role);
    
    const userObj: User = {
      name: session.name,
      email: session.email,
      role: session.role as UserRole
    };
    
    setUser(userObj);
    setTimeout(() => {
      setIsAuthLoading(false);
    }, 500);
  }
}
```

---

## 5. SAMPLE DATA

### Workers Table Sample Data
**Location**: [supabase-setup.sql](supabase-setup.sql#L351-L356)

```sql
INSERT INTO workers (id, full_name, date_of_birth, phone, email, address, profile_photo, type, payment_type, base_salary, username, password) VALUES
('worker-1', 'Ahmed Boudjellal', '1990-05-15', '+213 5 1234 5678', 'ahmed.worker@luxdrive.dz', 'Alger, Algeria', '...', 'worker', 'daily', 3500, 'ahmed.worker', 'worker123'),
('worker-2', 'Fatima Zahra', '1988-03-20', '+213 5 9876 5432', 'fatima.worker@luxdrive.dz', 'Oran, Algeria', '...', 'admin', 'monthly', 45000, 'fatima.admin', 'admin123'),
('worker-3', 'Mohamed Cherif', '1985-11-10', '+213 6 5555 1234', 'mohamed.driver@luxdrive.dz', 'Constantine, Algeria', '...', 'driver', 'daily', 4000, 'mohamed.driver', 'driver123');
-- Note: No agency_id column visible here
```

### Agencies Table Sample Data
**Location**: [supabase-setup.sql](supabase-setup.sql#L336-L340)

```sql
INSERT INTO agencies (id, name, address, phone, email, wilaya, city, manager, opening_hours) VALUES
('1', 'Agence Centre Ville', '123 Rue Principal, Alger Centre', '+213 21 123 456', 'centre@luxdrive.dz', '16 - Alger', 'Alger', 'Ahmed Bennani', '08:00 - 18:00'),
('2', 'Agence Aéroport', 'Aéroport Houari Boumediene, Alger', '+213 21 654 321', 'aeroport@luxdrive.dz', '16 - Alger', 'Alger', 'Fatima Zohra', '24/7'),
('3', 'Agence Oran', '456 Boulevard de la République, Oran', '+213 41 987 654', 'oran@luxdrive.dz', '31 - Oran', 'Oran', 'Mohamed Cherif', '08:00 - 17:00');
```

---

## 6. AGENCY_ID FILTERING LOCATIONS IN DatabaseService

### Workers Query
**Location**: [src/services/DatabaseService.ts](src/services/DatabaseService.ts#L407-L440)

```typescript
static async getWorkers(): Promise<Worker[]> {
  const { data, error } = await supabase
    .from('workers')
    .select(`
      *,
      advances:worker_advances(*),
      absences:worker_absences(*),
      payments:worker_payments(*)
    `)
    .order('created_at', { ascending: false });
  
  // ❌ NO agency_id filtering here because workers table has no agency_id!
  
  if (error) throw error;

  return (data || []).map(worker => ({
    id: worker.id,
    fullName: worker.full_name,
    dateOfBirth: worker.date_of_birth,
    phone: worker.phone,
    email: worker.email,
    address: worker.address,
    profilePhoto: worker.profile_photo,
    type: worker.type,
    paymentType: worker.payment_type,
    baseSalary: worker.base_salary,
    username: worker.username,
    password: worker.password,
    advances: worker.advances || [],
    absences: worker.absences || [],
    payments: worker.payments || [],
    createdAt: worker.created_at,
  }));
}
```

### Clients Query
**Location**: [src/services/DatabaseService.ts](src/services/DatabaseService.ts#L224+)

```typescript
// ❌ Clients queries also have NO agency_id filtering
static async getClients(): Promise<Client[]> {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
```

---

## 7. DOCUMENT TEMPLATES TABLE SCHEMA

**Location**: [create_document_templates_table.sql](create_document_templates_table.sql#L14)

```sql
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,  -- ✓ Has agency_id
  template_type text NOT NULL,
  name text NOT NULL,
  template jsonb NOT NULL,
  is_default boolean DEFAULT false,
  has_conditions boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_document_templates_agency_id ON document_templates(agency_id);
CREATE INDEX idx_document_templates_agency_template_type ON document_templates(agency_id, template_type);
CREATE INDEX idx_document_templates_agency_template_default ON document_templates(agency_id, template_type, is_default) WHERE is_default = true;
CREATE INDEX idx_document_templates_agency_name ON document_templates(agency_id, name);
```

---

## 8. RLS POLICIES WITH AGENCY FILTERING

### Document Templates RLS Policy
**Location**: [STRICT_PRINTING_SYSTEM_COMPLETE.md](STRICT_PRINTING_SYSTEM_COMPLETE.md#L186-L191)

```sql
-- Restrict by agency - users can only see/edit their agency's templates
CREATE POLICY "agency_isolation" ON document_templates
  USING (agency_id = auth.jwt() ->> 'agency_id')
  WITH CHECK (agency_id = auth.jwt() ->> 'agency_id');
```

**Problem**: This expects `auth.jwt() ->> 'agency_id'` to be set in JWT claims, but workers don't have this!

### Workers RLS Policies
**Location**: [workers_full_sql_setup.sql](workers_full_sql_setup.sql#L107-L130)

```sql
-- Workers - SELECT policy
CREATE POLICY "Allow authenticated users to read workers"
  ON public.workers
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Workers - INSERT policy
CREATE POLICY "Allow authenticated users to create workers"
  ON public.workers
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Workers - UPDATE policy
CREATE POLICY "Allow authenticated users to update workers"
  ON public.workers
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Workers - DELETE policy
CREATE POLICY "Allow authenticated users to delete workers"
  ON public.workers
  FOR DELETE
  USING (auth.role() = 'authenticated');
```

**Note**: These policies don't use agency_id filtering because workers table doesn't have agency_id!

---

## 9. SUMMARY TABLE

| Component | Where agency_id is used | Current Status | Issue |
|-----------|------------------------|-----------------|-------|
| **Admin Users** | profiles table | ✓ Works | Supabase Auth tracks agency |
| **Worker Users** | workers table | ✗ Missing | NO agency_id column in workers |
| **Templates** | document_templates table | ✓ Works | Filtered by agency_id in queries |
| **Print Service** | PrintService_v2 | ✓ Works | Takes agencyId parameter |
| **Template Service** | TemplateService | ✓ Works | Filters by agency_id |
| **DatabaseService Queries** | workers, clients | ✗ Missing | NO agency filtering implemented |
| **RLS Policies** | Document Templates | ⚠️ Partial | Expects agency_id in JWT claims |

---

## 10. KEY FINDINGS

### ✅ What Works
1. **Admin users** have `agency_id` stored in `profiles` table
2. **Templates** are properly filtered by `agency_id` in all queries
3. **Document rendering** retrieves the user's agency from profiles
4. **Template saving** includes the user's agency_id
5. **PrintService** passes agency context through the flow

### ❌ What's Missing
1. **Workers table has NO agency_id field** - Workers cannot be assigned to an agency
2. **DatabaseService.getWorkers()** does NOT filter by agency
3. **DatabaseService.getClients()** does NOT filter by agency
4. **Worker login function** returns only worker data - no agency context
5. **RLS policies for workers** don't check agency membership

### ⚠️ Architectural Issues
1. **Dual authentication without consistent agency tracking**:
   - Supabase Auth users have agency in profiles
   - Worker users have NO agency association
2. **Worker data access is not filtered by agency**
3. **Workers can theoretically access all workers/clients** from any agency
4. **Admin RLS policy expects `auth.jwt() ->> 'agency_id'`** but worker tokens don't have this

---

## 11. RECOMMENDATIONS

### Phase 1: Add agency_id to workers
```sql
ALTER TABLE workers ADD COLUMN agency_id TEXT REFERENCES agencies(id) ON DELETE SET NULL;

-- Update existing workers to a default agency (or require manual assignment)
UPDATE workers SET agency_id = '1' WHERE agency_id IS NULL;

-- Make it NOT NULL after populating
ALTER TABLE workers ALTER COLUMN agency_id SET NOT NULL;
```

### Phase 2: Implement worker scope in authentication
- Modify `login_worker()` RPC to include agency_id in response
- Store agency_id in session/localStorage when worker logs in
- Pass agency_id to all queries that should be scoped

### Phase 3: Filter queries by agency
```typescript
// Update DatabaseService.getWorkers()
static async getWorkers(agencyId?: string): Promise<Worker[]> {
  let query = supabase
    .from('workers')
    .select(...);
  
  if (agencyId) {
    query = query.eq('agency_id', agencyId);
  }
  
  const { data, error } = await query.order('created_at', { ascending: false });
  // ...
}
```

### Phase 4: Implement agency-aware RLS
```sql
-- Update workers table policy
CREATE POLICY "Users can access workers for their agency" ON workers
  USING (
    agency_id = (
      SELECT agency_id FROM profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    agency_id = (
      SELECT agency_id FROM profiles 
      WHERE id = auth.uid()
    )
  );
```

