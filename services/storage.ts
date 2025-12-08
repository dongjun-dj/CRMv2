import { Company, Customer, Department } from '../types';

const KEYS = {
  COMPANIES: 'icrm_companies',
  CUSTOMERS: 'icrm_customers',
  DEPARTMENTS: 'icrm_departments',
};

export const storage = {
  getCompanies: (): Company[] => {
    const data = localStorage.getItem(KEYS.COMPANIES);
    return data ? JSON.parse(data) : [];
  },
  saveCompanies: (data: Company[]) => {
    localStorage.setItem(KEYS.COMPANIES, JSON.stringify(data));
  },
  
  getCustomers: (): Customer[] => {
    const data = localStorage.getItem(KEYS.CUSTOMERS);
    return data ? JSON.parse(data) : [];
  },
  saveCustomers: (data: Customer[]) => {
    localStorage.setItem(KEYS.CUSTOMERS, JSON.stringify(data));
  },

  getDepartments: (): Department[] => {
    const data = localStorage.getItem(KEYS.DEPARTMENTS);
    return data ? JSON.parse(data) : [];
  },
  saveDepartments: (data: Department[]) => {
    localStorage.setItem(KEYS.DEPARTMENTS, JSON.stringify(data));
  }
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
