import Airtable from 'airtable';
import type {
  CustomerContact,
  Contact,
  Account,
  Activity,
  Task,
  Interaction,
  DiscoveryCallRecord,
  TeamMember,
  HREmployee,
  Lead,
  Deal,
  DesignDraft,
  DesignFeedback,
  CompletedLabelForm,
} from '../types/airtable.types';

// Configuration
const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const useWorkerProxy = import.meta.env.VITE_USE_WORKER_PROXY === 'true';
const workerUrl = import.meta.env.VITE_WORKER_URL;

if (!apiKey || !baseId) {
  console.warn('Airtable credentials not found. Please set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID in .env file');
}

// Initialize Airtable SDK (fallback when not using worker)
const base = new Airtable({ apiKey }).base(baseId);

// Worker Proxy Functions
async function workerFetch<T>(
  tableName: string,
  options?: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    recordId?: string;
    body?: unknown;
    queryParams?: Record<string, string>;
  }
): Promise<T> {
  if (!workerUrl) {
    throw new Error('Worker URL not configured. Set VITE_WORKER_URL in .env');
  }

  const { method = 'GET', recordId, body, queryParams } = options || {};

  // Build URL
  let url = `${workerUrl}/api/${encodeURIComponent(tableName)}`;
  if (recordId) {
    url += `/${recordId}`;
  }
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body && method !== 'GET') {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `Worker request failed: ${response.statusText}`);
  }

  return response.json();
}

// Generic fetch function - supports both direct Airtable and Worker proxy
async function fetchRecords<T>(tableName: string, options?: {
  filterByFormula?: string;
  sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
  maxRecords?: number;
}): Promise<T[]> {
  try {
    if (useWorkerProxy) {
      // Use Worker proxy
      const queryParams: Record<string, string> = {};

      if (options?.filterByFormula) {
        queryParams.filterByFormula = options.filterByFormula;
      }
      if (options?.sort) {
        queryParams.sort = JSON.stringify(options.sort);
      }
      if (options?.maxRecords) {
        queryParams.maxRecords = options.maxRecords.toString();
      }

      const response = await workerFetch<{ records: T[] }>(tableName, { queryParams });
      return response.records || [];
    } else {
      // Direct Airtable SDK
      const selectOptions: Record<string, unknown> = {};

      if (options?.filterByFormula) {
        selectOptions.filterByFormula = options.filterByFormula;
      }
      if (options?.sort) {
        selectOptions.sort = options.sort;
      }
      if (options?.maxRecords) {
        selectOptions.maxRecords = options.maxRecords;
      }

      const records = await base(tableName)
        .select(selectOptions)
        .all();

      return records.map(record => ({
        id: record.id,
        fields: record.fields,
      })) as T[];
    }
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error);
    throw error;
  }
}

// Generic get by ID function
async function getRecordById<T>(tableName: string, recordId: string): Promise<T> {
  try {
    if (useWorkerProxy) {
      return await workerFetch<T>(tableName, { recordId });
    } else {
      const record = await base(tableName).find(recordId);
      return { id: record.id, fields: record.fields } as T;
    }
  } catch (error) {
    console.error(`Error fetching record ${recordId} from ${tableName}:`, error);
    throw error;
  }
}

// Generic create function
async function createRecord<T>(tableName: string, fields: Record<string, unknown>): Promise<T> {
  try {
    if (useWorkerProxy) {
      return await workerFetch<T>(tableName, {
        method: 'POST',
        body: { fields },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record: any = await base(tableName).create(fields as never);
      return {
        id: record.id,
        fields: record.fields,
      } as T;
    }
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    throw error;
  }
}

// Generic update function
async function updateRecord<T>(tableName: string, recordId: string, fields: Record<string, unknown>): Promise<T> {
  try {
    if (useWorkerProxy) {
      return await workerFetch<T>(tableName, {
        method: 'PATCH',
        recordId,
        body: { fields },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const record: any = await base(tableName).update(recordId, fields as never);
      return {
        id: record.id,
        fields: record.fields,
      } as T;
    }
  } catch (error) {
    console.error(`Error updating record in ${tableName}:`, error);
    throw error;
  }
}

// Generic delete function
async function deleteRecord(tableName: string, recordId: string): Promise<void> {
  try {
    if (useWorkerProxy) {
      await workerFetch(tableName, {
        method: 'DELETE',
        recordId,
      });
    } else {
      await base(tableName).destroy(recordId);
    }
  } catch (error) {
    console.error(`Error deleting record from ${tableName}:`, error);
    throw error;
  }
}

// Customer Contact Services
export const customerContactService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<CustomerContact>('Customer Contact', options),
  getById: (id: string) => getRecordById<CustomerContact>('Customer Contact', id),
  create: (fields: CustomerContact['fields']) =>
    createRecord<CustomerContact>('Customer Contact', fields),
  update: (id: string, fields: Partial<CustomerContact['fields']>) =>
    updateRecord<CustomerContact>('Customer Contact', id, fields),
  delete: (id: string) => deleteRecord('Customer Contact', id),
};

// Contact Services
export const contactService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<Contact>('Contact', options),
  getById: (id: string) => getRecordById<Contact>('Contact', id),
  create: (fields: Contact['fields']) =>
    createRecord<Contact>('Contact', fields),
  update: (id: string, fields: Partial<Contact['fields']>) =>
    updateRecord<Contact>('Contact', id, fields),
  delete: (id: string) => deleteRecord('Contact', id),
};

// Account Services
export const accountService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<Account>('Account', options),
  getById: (id: string) => getRecordById<Account>('Account', id),
  create: (fields: Account['fields']) =>
    createRecord<Account>('Account', fields),
  update: (id: string, fields: Partial<Account['fields']>) =>
    updateRecord<Account>('Account', id, fields),
  delete: (id: string) => deleteRecord('Account', id),
};

// Activity Services
export const activityService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<Activity>('Activities', options),
  getById: (id: string) => getRecordById<Activity>('Activities', id),
  create: (fields: Activity['fields']) =>
    createRecord<Activity>('Activities', fields),
  update: (id: string, fields: Partial<Activity['fields']>) =>
    updateRecord<Activity>('Activities', id, fields),
  delete: (id: string) => deleteRecord('Activities', id),
};

// Task Services
export const taskService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<Task>('Tasks', options),
  getById: (id: string) => getRecordById<Task>('Tasks', id),
  create: (fields: Task['fields']) =>
    createRecord<Task>('Tasks', fields),
  update: (id: string, fields: Partial<Task['fields']>) =>
    updateRecord<Task>('Tasks', id, fields),
  delete: (id: string) => deleteRecord('Tasks', id),
};

// Interaction Services
export const interactionService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<Interaction>('Interactions', options),
  getById: (id: string) => getRecordById<Interaction>('Interactions', id),
  create: (fields: Interaction['fields']) =>
    createRecord<Interaction>('Interactions', fields),
  update: (id: string, fields: Partial<Interaction['fields']>) =>
    updateRecord<Interaction>('Interactions', id, fields),
  delete: (id: string) => deleteRecord('Interactions', id),
};

// Discovery Call Record Services
export const discoveryCallService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<DiscoveryCallRecord>('Discovery Call Records', options),
  getById: (id: string) => getRecordById<DiscoveryCallRecord>('Discovery Call Records', id),
  create: (fields: DiscoveryCallRecord['fields']) =>
    createRecord<DiscoveryCallRecord>('Discovery Call Records', fields),
  update: (id: string, fields: Partial<DiscoveryCallRecord['fields']>) =>
    updateRecord<DiscoveryCallRecord>('Discovery Call Records', id, fields),
  delete: (id: string) => deleteRecord('Discovery Call Records', id),
};

// Team Member Services
export const teamMemberService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<TeamMember>('Team Members', options),
  getById: (id: string) => getRecordById<TeamMember>('Team Members', id),
};

// HR Employee Services (Employees table)
export const hrEmployeeService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<HREmployee>('Employees', options),
  getById: (id: string) => getRecordById<HREmployee>('Employees', id),
  create: (fields: HREmployee['fields']) =>
    createRecord<HREmployee>('Employees', fields),
  update: (id: string, fields: Partial<HREmployee['fields']>) =>
    updateRecord<HREmployee>('Employees', id, fields),
  delete: (id: string) => deleteRecord('Employees', id),
};

// Leads Services
export const leadsService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<Lead>('Leads', options),
  getById: (id: string) => getRecordById<Lead>('Leads', id),
  create: (fields: Lead['fields']) =>
    createRecord<Lead>('Leads', fields),
  update: (id: string, fields: Partial<Lead['fields']>) =>
    updateRecord<Lead>('Leads', id, fields),
  delete: (id: string) => deleteRecord('Leads', id),
};

// Design Drafts Services
export const designDraftsService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<DesignDraft>('Design Drafts', options),
  getById: (id: string) => getRecordById<DesignDraft>('Design Drafts', id),
  create: (fields: DesignDraft['fields']) =>
    createRecord<DesignDraft>('Design Drafts', fields),
  update: (id: string, fields: Partial<DesignDraft['fields']>) =>
    updateRecord<DesignDraft>('Design Drafts', id, fields),
  delete: (id: string) => deleteRecord('Design Drafts', id),
};

// Design Feedback Services
export const designFeedbackService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<DesignFeedback>('Design Feedback', options),
  getById: (id: string) => getRecordById<DesignFeedback>('Design Feedback', id),
  create: (fields: DesignFeedback['fields']) =>
    createRecord<DesignFeedback>('Design Feedback', fields),
  update: (id: string, fields: Partial<DesignFeedback['fields']>) =>
    updateRecord<DesignFeedback>('Design Feedback', id, fields),
  delete: (id: string) => deleteRecord('Design Feedback', id),
};

// Deals Services
export const dealsService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<Deal>('Deals', options),
  getById: (id: string) => getRecordById<Deal>('Deals', id),
  create: (fields: Deal['fields']) =>
    createRecord<Deal>('Deals', fields),
  update: (id: string, fields: Partial<Deal['fields']>) =>
    updateRecord<Deal>('Deals', id, fields),
  delete: (id: string) => deleteRecord('Deals', id),
};

// Completed Label Forms Services (Submissions table)
export const completedLabelFormsService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<CompletedLabelForm>('Submissions', options),
  getById: (id: string) => getRecordById<CompletedLabelForm>('Submissions', id),
  create: (fields: CompletedLabelForm['fields']) =>
    createRecord<CompletedLabelForm>('Submissions', fields),
  update: (id: string, fields: Partial<CompletedLabelForm['fields']>) =>
    updateRecord<CompletedLabelForm>('Submissions', id, fields),
  delete: (id: string) => deleteRecord('Submissions', id),
};
