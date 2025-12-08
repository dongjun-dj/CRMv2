import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';
import { storage } from '../services/storage';
import { excelService, ExportStatus } from '../services/excelService';
import { Company, Customer, Department } from '../types';

// Mock storage service
vi.mock('../services/storage', () => ({
  storage: {
    getCompanies: vi.fn(),
    saveCompanies: vi.fn(),
    getCustomers: vi.fn(),
    saveCustomers: vi.fn(),
    getDepartments: vi.fn(),
    saveDepartments: vi.fn(),
  },
  generateId: vi.fn(() => 'test-id-123'),
}));

// Mock location service
vi.mock('../data/locations', () => ({
  locationService: {
    init: vi.fn().mockResolvedValue(undefined),
    search: vi.fn().mockResolvedValue(['广东省-深圳市-南山区']),
  },
}));

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('Excel导出功能测试', () => {
  const mockCompanies: Company[] = [
    { id: 'company-1', name: '测试公司A', createdAt: Date.now() },
  ];
  const mockCustomers: Customer[] = [
    { 
      id: 'customer-1', 
      companyId: 'company-1', 
      name: '客户A', 
      phone: '13800138001',
      email: 'customer1@example.com',
      departmentId: 'dept-1',
      jobTitle: '销售经理',
      managerId: 'customer-2',
      hometown: '广东省-深圳市-南山区',
      status: 2 as any,
      hobbies: '阅读、旅游',
      familyInfo: '已婚，有一个孩子',
      notes: '重要客户',
      createdAt: Date.now() 
    },
    { 
      id: 'customer-2', 
      companyId: 'company-1', 
      name: '客户B', 
      phone: '13800138002',
      createdAt: Date.now() 
    },
  ];
  const mockDepartments: Department[] = [
    { id: 'dept-1', name: '销售部', companyId: 'company-1' },
    { id: 'dept-2', name: '技术部', companyId: 'company-1' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock storage methods
    (storage.getCompanies as any).mockReturnValue(mockCompanies);
    (storage.getCustomers as any).mockReturnValue(mockCustomers);
    (storage.getDepartments as any).mockReturnValue(mockDepartments);
    
    // Mock alert
    global.alert = vi.fn();
  });


  it('应该能够在导入/导出页面导出Excel', async () => {
    const user = userEvent.setup();
    const XLSX = await import('xlsx');
    
    render(<App />);
    
    // 首先选择公司
    const companyButton = screen.getByText('测试公司A');
    await user.click(companyButton);
    
    // 等待客户列表加载
    await waitFor(() => {
      expect(screen.getByText('客户A')).toBeInTheDocument();
    });
    
    // 点击导入/导出按钮 - 查找包含特定SVG的按钮
    const allButtons = screen.getAllByRole('button');
    const importExportButton = allButtons.find(button => 
      button.innerHTML.includes('path') && button.innerHTML.includes('4 12v8')
    );
    
    if (importExportButton) {
      await user.click(importExportButton);
    }
    
    // 等待导入/导出页面加载
    await waitFor(() => {
      expect(screen.getByText('数据导出')).toBeInTheDocument();
    });
    
    // 点击导出Excel按钮
    const exportButton = screen.getByText('导出 Excel');
    await user.click(exportButton);
    
    // 验证XLSX相关方法被调用
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('应该能够在没有客户数据时导出示例模板', async () => {
    const user = userEvent.setup();
    const XLSX = await import('xlsx');
    
    // Mock空客户列表
    (storage.getCustomers as any).mockReturnValue([]);
    
    render(<App />);
    
    // 首先选择公司
    const companyButton = screen.getByText('测试公司A');
    await user.click(companyButton);
    
    // 等待客户列表加载
    await waitFor(() => {
      expect(screen.getByText('暂无客户数据')).toBeInTheDocument();
    });
    
    // 点击导入/导出按钮
    const allButtons = screen.getAllByRole('button');
    const importExportButton = allButtons.find(button => 
      button.innerHTML.includes('path') && button.innerHTML.includes('4 12v8')
    );
    
    if (importExportButton) {
      await user.click(importExportButton);
    }
    
    // 等待导入/导出页面加载
    await waitFor(() => {
      expect(screen.getByText('数据导出')).toBeInTheDocument();
    });
    
    // 点击导出Excel按钮
    const exportButton = screen.getByText('导出 Excel');
    await user.click(exportButton);
    
    // 验证XLSX相关方法被调用
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });
});