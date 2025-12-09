// Customer Contact Types
export interface CustomerContact {
  id: string;
  fields: {
    'Customer ID': string;
    'Contact Name'?: string;
    'Phone'?: string;
    'Discovery Source'?: 'WhatsApp' | 'Facebook' | 'Instagram' | 'TikTok' | 'Call' | 'Walk-In' | 'Lead';
    'Tag'?: string[];
    'Created by'?: string[];
    'Account Manager'?: string[];
    'Account'?: string[];
    'Tasks'?: string[];
    'Interactions'?: string[];
    'Last Interaction'?: string;
  };
}

// Contact (Primary) Types
export interface Contact {
  id: string;
  fields: {
    'Phone': string;
    'Name'?: string;
    'Email'?: string;
    'Business / Company'?: string[];
    'Contact ID'?: string;
    'Lead Status'?: ('New Lead' | 'Attempted to Contact' | 'Contacted' | 'Qualified' | 'Unqualified')[];
    'Created by'?: string[];
    'Created on'?: string;
    'Last Modified by'?: string[];
    'Activities'?: string[];
    'Deals'?: string[];
    'Leads'?: string[];
    'Discovery Call Records'?: string[];
    'Client Projects'?: string[];
  };
}

// Account Types
export interface Account {
  id: string;
  fields: {
    'Account Name': string;
    'Industry'?: 'Beverage' | 'Food' | 'Skincare' | 'Manufacturing' | 'FMCG' | string;
    'Size'?: '1-10' | '11-50' | '51-100' | '101-500' | '501-1000' | '1000-5000' | '10,000+';
    'Location'?: string;
    'City'?: string;
    'Account Status'?: 'Active' | 'Inactive';
    'Company Website'?: string;
    'Social Media Handle'?: string;
    'Platform'?: 'Instagram' | 'Facebook' | 'Snapchat' | 'TikTok';
    'Account owner'?: string[];
    'Logo'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Notes'?: string;
    'Task Progress'?: number;
  };
}

// Activity Types
export interface Activity {
  id: string;
  fields: {
    'Activity Number': string;
    'Activity'?: string;
    'Activity Type'?: 'Meeting' | 'Phone Call' | 'Call Summary' | 'WhatsApp Chat';
    'Status'?: 'Open' | 'Done';
    'Owner'?: string[];
    'Start time'?: string;
    'End time'?: string;
    'Contact'?: string[];
    'Activity Summary (Activity)'?: string;
    'Related Deals'?: string[];
    'Leads'?: string[];
    'Contact 2'?: string[];
    'COMMENTSs'?: string;
  };
}

// Task Types
export interface Task {
  id: string;
  fields: {
    'Task Title': string;
    'Task Description'?: string;
    'Status'?: 'To do' | 'In progress' | 'Done';
    'Priority'?: 'High' | 'Medium' | 'Low';
    'Task Owner'?: string[];
    'Task Start'?: string;
    'Task Deadline'?: string;
    'Task Added'?: string;
    'Accounts'?: string[];
    'Contact'?: string[];
    'Customer Contact'?: string[];
    'Interactions'?: string[];
  };
}

// Interaction Types
export interface Interaction {
  id: string;
  fields: {
    'Name': string;
    'Type'?: 'Discovery' | 'Label discussion' | 'Price Discussion' | 'Custom Solution' | 'Weekly Check-in';
    'Date & Time'?: string;
    'Team Member'?: string[];
    'Notes'?: string;
    'Customer Contact'?: string[];
    'Account'?: string[];
    'Tasks'?: string[];
  };
}

// Discovery Call Record Types
export interface DiscoveryCallRecord {
  id: string;
  fields: {
    'Order ID': string;
    'Discovery Call Name'?: string;
    'Company Name'?: string;
    'Contact Email'?: string;
    'Contact Phone'?: string;
    'Call Date'?: string;
    'Discovery Call Owner'?: string[];
    'Discovery Status'?: 'Reached' | 'Unreachable';
    'Project/Topic'?: string;
    'Project Description/Notes'?: string;
    'Key Questions Asked'?: string;
    'Customer Pain Points'?: string;
    'Desired Outcomes'?: string;
    'Next Steps'?: string;
    'Call Recording'?: string;
    'Files/Attachments'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Discovery Call Summary (AI)'?: string;
    'Action Items (AI)'?: string;
  };
}

// Team Member Types
export interface TeamMember {
  id: string;
  fields: {
    'Name': string;
    'Email'?: string;
    'Role'?: string;
  };
}

// HR Employees Types (Employees table)
export interface HREmployee {
  id: string;
  fields: {
    'Full Name': string;
    'Email': string;
    'Password': string;
    'Employee ID'?: string;
    'Job Title'?: string;
    'Department'?: 'Administration' | 'Management' | 'Production' | 'Operations' | 'Customer Service' | 'Logistics' | 'Warehousing & Fulfilment' | 'Finance' | 'Sales' | 'Marketing' | 'Engineering' | 'Creative Design' | 'Pakkmax';
    'Role'?: 'Admin' | 'Employee' | 'Manager';
    'Account Status'?: 'Active' | 'Inactive';
    'Phone Number'?: string;
    'Employment Type'?: 'Full-time' | 'Part-time' | 'Contract' | 'Temporary';
  };
}

// Leads Types
export interface Lead {
  id: string;
  fields: {
    'Contact': string[];  // Primary field - displays lead's name from linked contact
    'Lead'?: string[];  // Links to main Contact table
    'Company'?: string;
    'Email'?: string;
    'Phone'?: string;
    'Title'?: string;
    'Status'?: 'New Lead' | 'Attempted to Contact' | 'Contacted' | 'Qualified' | 'Unqualified';
    'Owner'?: string[];  // Links to Team Members
    'Created on'?: string;
    'Modified by'?: string[];
    'Modified on'?: string;
    'Last Interaction'?: string;
    'Activities'?: string[];  // Links to Activities
    'Activity'?: string;
    'Deals'?: string[];  // Links to Deals
    'Related Deals'?: string[];
    'Stage'?: 'New' | 'Discovery' | 'Prospective' | 'Invoice' | 'Won' | 'Lost';
    'Deal Title'?: string[];
  };
}

// Design Drafts Types
export interface DesignDraft {
  id: string;
  fields: {
    'Name': string;  // Primary - auto displays product name
    'Project Information'?: string[];  // Links to submission/order
    'Order Number'?: string;
    'Order Link'?: string;  // Auto-generated tracking URLs
    'Project Type'?: 'Logo Design' | 'Label Design' | 'Poly Bag Design' | 'Paper Bag Design' | 'Flier' | 'Banner';
    'Customer Name'?: string;
    'Phone Number'?: string;
    'Project File Link'?: string;
    'Linked Contact'?: string[];  // Connection to submission records
    'Status'?: 'Incomplete Information' | 'Unreachable' | 'Design' | 'Revision' | 'Production' | 'Final Handoff';
    'Design Draft 1'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Revision 1'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Revision 2'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Revision 3'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Revision 1 Notes'?: string;
    'Revision 2 Notes'?: string;
    'Revision 3 Notes'?: string;
    'Revisions Left'?: number;  // Auto-calculates remaining revisions
    'Ingredients'?: string;
    'Weight/Volume'?: string;
    'Color'?: string;
    'Files Uploaded'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Annotated Design Rev 1'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Annotated Design Rev 2'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Annotated Design Rev 3'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Annotated Design Rev 4'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Feedback Rev 1'?: string;
    'Feedback Rev 2'?: string;
    'Feedback Rev 3'?: string;
    'Feedback Rev 4'?: string;
    'Total Comments Rev 1'?: number;
    'Total Comments Rev 2'?: number;
    'Total Comments Rev 3'?: number;
    'Total Comments Rev 4'?: number;
    'Feedback Created Rev 1'?: string;
    'Feedback Created Rev 2'?: string;
    'Feedback Created Rev 3'?: string;
    'Feedback Created Rev 4'?: string;
    'Created by'?: string[];
    'Role'?: string;
    'Created on'?: string;
    'Latest Update'?: string;
    'Status Update Log'?: string;
    'Send WhatsApp Update'?: string;
    'Message Sent'?: boolean;
    'Design Feedback'?: string[];  // Links to Design Feedback table
    'Design Name'?: string;
  };
}

// Design Feedback Types
export interface DesignFeedback {
  id: string;
  fields: {
    'Customer': string;  // Primary
    'Order ID'?: string;
    'Feedback'?: string;
    'Total Comments'?: number;
    'Annotated Design'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Related Submission'?: string[];
    'Related Design Drafts'?: string[];
    'Design Drafts 2'?: string[];
    'Design Drafts 3'?: string[];
    'Design Drafts 4'?: string[];
  };
}

// Deals Types
export interface Deal {
  id: string;
  fields: {
    'Deal Name': string;  // Primary
    'Deal ID'?: string;
    'Contact'?: string[];  // Links to Contact
    'Account'?: string[];  // Links to Account
    'Stage'?: 'New' | 'Discovery' | 'Prospective' | 'Invoice' | 'Won' | 'Lost';
    'Amount'?: number;
    'Currency'?: string;
    'Close Date'?: string;
    'Probability'?: number;
    'Deal Owner'?: string[];  // Links to Team Members
    'Lead Source'?: string;
    'Created on'?: string;
    'Modified on'?: string;
    'Activities'?: string[];  // Links to Activities
    'Leads'?: string[];  // Links to Leads
    'Notes'?: string;
    'Next Steps'?: string;
    'Lost Reason'?: string;
  };
}

// Completed Label Forms Types
export interface CompletedLabelForm {
  id: string;
  fields: {
    'Form ID': string;  // Primary
    'Customer Name'?: string;
    'Contact'?: string[];  // Links to Contact
    'Product Name'?: string;
    'Label Type'?: 'Sticker Label' | 'Shrink Sleeve' | 'Wrap Around' | 'Front & Back' | 'Custom';
    'Dimensions'?: string;
    'Quantity'?: number;
    'Material'?: string;
    'Finish'?: 'Glossy' | 'Matte' | 'Textured';
    'Colors'?: string;
    'Barcode Required'?: boolean;
    'Barcode Type'?: string;
    'Ingredients'?: string;
    'Regulatory Info'?: string;
    'Artwork Status'?: 'Not Started' | 'In Progress' | 'Submitted' | 'Approved';
    'Submission Date'?: string;
    'Approval Date'?: string;
    'Design Drafts'?: string[];  // Links to Design Drafts
    'Discovery Call'?: string[];  // Links to Discovery Call Records
    'Files Attached'?: Array<{
      id: string;
      url: string;
      filename: string;
      size: number;
      type: string;
    }>;
    'Special Instructions'?: string;
    'Created by'?: string[];
    'Created on'?: string;
  };
}

// Table Names
export const TABLE_NAMES = {
  CUSTOMER_CONTACT: 'Customer Contact',
  CONTACT: 'Contact',
  ACCOUNT: 'Account',
  ACTIVITIES: 'Activities',
  TASKS: 'Tasks',
  INTERACTIONS: 'Interactions',
  DISCOVERY_CALL_RECORDS: 'Discovery Call Records',
  TEAM_MEMBERS: 'Team Members',
  HR_EMPLOYEES: 'Employees',
  LEADS: 'Leads',
  DEALS: 'Deals',
  DESIGN_DRAFTS: 'Design Drafts',
  DESIGN_FEEDBACK: 'Design Feedback',
  COMPLETED_LABEL_FORMS: 'Completed Label Forms',
} as const;
