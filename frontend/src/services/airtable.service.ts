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

// Initialize Airtable
const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;

if (!apiKey || !baseId) {
  console.warn('Airtable credentials not found. Please set VITE_AIRTABLE_API_KEY and VITE_AIRTABLE_BASE_ID in .env file');
}

const base = new Airtable({ apiKey }).base(baseId);

// Generic fetch function
async function fetchRecords<T>(tableName: string, options?: {
  filterByFormula?: string;
  sort?: Array<{ field: string; direction?: 'asc' | 'desc' }>;
  maxRecords?: number;
}): Promise<T[]> {
  try {
    // Build select options object only with defined values
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
  } catch (error) {
    console.error(`Error fetching records from ${tableName}:`, error);
    throw error;
  }
}

// Generic create function
async function createRecord<T>(tableName: string, fields: Record<string, unknown>): Promise<T> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record: any = await base(tableName).create(fields as never);
    return {
      id: record.id,
      fields: record.fields,
    } as T;
  } catch (error) {
    console.error(`Error creating record in ${tableName}:`, error);
    throw error;
  }
}

// Generic update function
async function updateRecord<T>(tableName: string, recordId: string, fields: Record<string, unknown>): Promise<T> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const record: any = await base(tableName).update(recordId, fields as never);
    return {
      id: record.id,
      fields: record.fields,
    } as T;
  } catch (error) {
    console.error(`Error updating record in ${tableName}:`, error);
    throw error;
  }
}

// Generic delete function
async function deleteRecord(tableName: string, recordId: string): Promise<void> {
  try {
    await base(tableName).destroy(recordId);
  } catch (error) {
    console.error(`Error deleting record from ${tableName}:`, error);
    throw error;
  }
}

// Customer Contact Services
export const customerContactService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<CustomerContact>('Customer Contact', options),
  getById: async (id: string) => {
    const record = await base('Customer Contact').find(id);
    return { id: record.id, fields: record.fields } as CustomerContact;
  },
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
  getById: async (id: string) => {
    const record = await base('Contact').find(id);
    return { id: record.id, fields: record.fields } as Contact;
  },
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
  getById: async (id: string) => {
    const record = await base('Account').find(id);
    return { id: record.id, fields: record.fields } as Account;
  },
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
  getById: async (id: string) => {
    const record = await base('Activities').find(id);
    return { id: record.id, fields: record.fields } as Activity;
  },
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
  getById: async (id: string) => {
    const record = await base('Tasks').find(id);
    return { id: record.id, fields: record.fields } as Task;
  },
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
  getById: async (id: string) => {
    const record = await base('Interactions').find(id);
    return { id: record.id, fields: record.fields } as Interaction;
  },
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
  getById: async (id: string) => {
    const record = await base('Discovery Call Records').find(id);
    return { id: record.id, fields: record.fields } as DiscoveryCallRecord;
  },
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
  getById: async (id: string) => {
    const record = await base('Team Members').find(id);
    return { id: record.id, fields: record.fields } as TeamMember;
  },
};

// HR Employee Services (Employees table)
export const hrEmployeeService = {
  getAll: (options?: Parameters<typeof fetchRecords>[1]) =>
    fetchRecords<HREmployee>('Employees', options),
  getById: async (id: string) => {
    const record = await base('Employees').find(id);
    return { id: record.id, fields: record.fields } as HREmployee;
  },
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
  getById: async (id: string) => {
    const record = await base('Leads').find(id);
    return { id: record.id, fields: record.fields } as Lead;
  },
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
  getById: async (id: string) => {
    const record = await base('Design Drafts').find(id);
    return { id: record.id, fields: record.fields } as DesignDraft;
  },
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
  getById: async (id: string) => {
    const record = await base('Design Feedback').find(id);
    return { id: record.id, fields: record.fields } as DesignFeedback;
  },
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
  getById: async (id: string) => {
    const record = await base('Deals').find(id);
    return { id: record.id, fields: record.fields } as Deal;
  },
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
  getById: async (id: string) => {
    const record = await base('Submissions').find(id);
    return { id: record.id, fields: record.fields } as CompletedLabelForm;
  },
  create: (fields: CompletedLabelForm['fields']) =>
    createRecord<CompletedLabelForm>('Submissions', fields),
  update: (id: string, fields: Partial<CompletedLabelForm['fields']>) =>
    updateRecord<CompletedLabelForm>('Submissions', id, fields),
  delete: (id: string) => deleteRecord('Submissions', id),
};
