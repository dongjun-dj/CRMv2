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
  },

  // Import screens only work with one company's filtered data. Merge that data
  // back into the global collections so importing one company cannot erase
  // records belonging to another company.
  saveCompanyData: (
    companyId: string,
    customers: Customer[],
    departments: Department[],
    allCustomers: Customer[] = storage.getCustomers(),
    allDepartments: Department[] = storage.getDepartments()
  ) => {
    const otherCustomers = allCustomers.filter(
      customer => customer.companyId !== companyId
    );
    const otherDepartments = allDepartments.filter(
      department => department.companyId !== companyId
    );

    storage.saveCustomers([...otherCustomers, ...customers]);
    storage.saveDepartments([...otherDepartments, ...departments]);
  }
};

export const generateId = () => Math.random().toString(36).substr(2, 9);
