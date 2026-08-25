import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storage } from '../services/storage';
import { Customer, Department } from '../types';

describe('storage.saveCompanyData', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.mocked(localStorage.getItem).mockImplementation(key => values.get(key) ?? null);
    vi.mocked(localStorage.setItem).mockImplementation((key, value) => {
      values.set(key, value);
    });
  });

  it('导入当前公司时保留其他公司的客户和部门', () => {
    const otherCustomer: Customer = {
      id: 'customer-b',
      companyId: 'company-b',
      name: '公司B客户',
      createdAt: 1
    };
    const otherDepartment: Department = {
      id: 'department-b',
      companyId: 'company-b',
      name: '公司B部门'
    };
    storage.saveCustomers([
      { id: 'old-a', companyId: 'company-a', name: '旧客户', createdAt: 1 },
      otherCustomer
    ]);
    storage.saveDepartments([
      { id: 'old-department-a', companyId: 'company-a', name: '旧部门' },
      otherDepartment
    ]);

    const importedCustomers: Customer[] = [
      { id: 'new-a', companyId: 'company-a', name: '导入客户', createdAt: 2 }
    ];
    const importedDepartments: Department[] = [
      { id: 'new-department-a', companyId: 'company-a', name: '导入部门' }
    ];

    storage.saveCompanyData('company-a', importedCustomers, importedDepartments);

    expect(storage.getCustomers()).toEqual([otherCustomer, ...importedCustomers]);
    expect(storage.getDepartments()).toEqual([otherDepartment, ...importedDepartments]);
  });
});
