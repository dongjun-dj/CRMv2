import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';
import { storage } from '../services/storage';
import { Company } from '../types';

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

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

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('公司删除功能测试', () => {
  const mockOnSelect = vi.fn();
  const mockCompanies: Company[] = [
    { id: 'company-1', name: '测试公司A', createdAt: Date.now() },
    { id: 'company-2', name: '测试公司B', createdAt: Date.now() },
  ];
  const mockCustomers = [
    { id: 'customer-1', companyId: 'company-1', name: '客户A', createdAt: Date.now() },
    { id: 'customer-2', companyId: 'company-1', name: '客户B', createdAt: Date.now() },
  ];
  const mockDepartments = [
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

  it('应该显示公司列表', () => {
    render(<App />);
    
    expect(screen.getByText('测试公司A')).toBeInTheDocument();
    expect(screen.getByText('测试公司B')).toBeInTheDocument();
  });

  it('应该能够删除公司并显示确认对话框', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 长按或点击删除按钮
    const deleteButton = screen.getAllByRole('button')[1]; // 第二个按钮是删除按钮
    await user.click(deleteButton);
    
    // 验证确认对话框出现
    expect(screen.getByText('确认删除')).toBeInTheDocument();
    expect(screen.getByText('该公司内的所有客户信息将被删除，是否确认操作？')).toBeInTheDocument();
  });

  it('应该能够选择在删除时导出Excel', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 长按或点击删除按钮
    const deleteButton = screen.getAllByRole('button')[1]; // 第二个按钮是删除按钮
    await user.click(deleteButton);
    
    // 验证导出选项默认被选中
    const exportCheckbox = screen.getByRole('checkbox');
    expect(exportCheckbox).toBeChecked();
    
    // 可以取消勾选
    await user.click(exportCheckbox);
    expect(exportCheckbox).not.toBeChecked();
  });

  it('应该能够确认删除公司', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 长按或点击删除按钮
    const deleteButton = screen.getAllByRole('button')[1]; // 第二个按钮是删除按钮
    await user.click(deleteButton);
    
    // 点击确认删除
    const confirmButton = screen.getByText('确认');
    await user.click(confirmButton);
    
    // 验证storage.saveCompanies被调用
    expect(storage.saveCompanies).toHaveBeenCalledWith([mockCompanies[1]]);
    
    // 验证storage.saveCustomers被调用（删除该公司下的客户）
    expect(storage.saveCustomers).toHaveBeenCalledWith([]);
    
    // 验证storage.saveDepartments被调用（删除该公司下的部门）
    expect(storage.saveDepartments).toHaveBeenCalledWith([]);
  });

  it('应该能够取消删除操作', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 长按或点击删除按钮
    const deleteButton = screen.getAllByRole('button')[1]; // 第二个按钮是删除按钮
    await user.click(deleteButton);
    
    // 点击取消
    const cancelButton = screen.getByText('取消');
    await user.click(cancelButton);
    
    // 验证storage方法未被调用
    expect(storage.saveCompanies).not.toHaveBeenCalled();
    expect(storage.saveCustomers).not.toHaveBeenCalled();
    expect(storage.saveDepartments).not.toHaveBeenCalled();
    
    // 验证对话框关闭
    expect(screen.queryByText('确认删除')).not.toBeInTheDocument();
  });

  it('删除时应该导出Excel文件（如果选中）', async () => {
    const user = userEvent.setup();
    const XLSX = await import('xlsx');
    
    render(<App />);
    
    // 长按或点击删除按钮
    const deleteButton = screen.getAllByRole('button')[1]; // 第二个按钮是删除按钮
    await user.click(deleteButton);
    
    // 确保导出选项被选中
    const exportCheckbox = screen.getByRole('checkbox');
    expect(exportCheckbox).toBeChecked();
    
    // 点击确认删除
    const confirmButton = screen.getByText('确认');
    await user.click(confirmButton);
    
    // 验证XLSX相关方法被调用
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
    expect(XLSX.utils.book_new).toHaveBeenCalled();
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
    expect(XLSX.writeFile).toHaveBeenCalled();
  });

  it('删除时应该不导出Excel文件（如果未选中）', async () => {
    const user = userEvent.setup();
    const XLSX = await import('xlsx');
    
    render(<App />);
    
    // 长按或点击删除按钮
    const deleteButton = screen.getAllByRole('button')[1]; // 第二个按钮是删除按钮
    await user.click(deleteButton);
    
    // 取消勾选导出选项
    const exportCheckbox = screen.getByRole('checkbox');
    await user.click(exportCheckbox);
    
    // 点击确认删除
    const confirmButton = screen.getByText('确认');
    await user.click(confirmButton);
    
    // 验证XLSX文件写入方法未被调用
    expect(XLSX.writeFile).not.toHaveBeenCalled();
  });

  it('删除出错时应该显示错误提示', async () => {
    const user = userEvent.setup();
    
    // Mock saveCompanies抛出错误
    (storage.saveCompanies as any).mockImplementationOnce(() => {
      throw new Error('删除失败');
    });
    
    render(<App />);
    
    // 长按或点击删除按钮
    const deleteButton = screen.getAllByRole('button')[1]; // 第二个按钮是删除按钮
    await user.click(deleteButton);
    
    // 点击确认删除
    const confirmButton = screen.getByText('确认');
    await user.click(confirmButton);
    
    // 验证错误提示
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('删除公司失败，请重试');
    });
  });
});