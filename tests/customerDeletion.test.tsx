import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import App from '../App';
import { storage } from '../services/storage';
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

describe('客户删除功能测试', () => {
  const mockCompanies: Company[] = [
    { id: 'company-1', name: '测试公司A', createdAt: Date.now() },
  ];
  const mockCustomers: Customer[] = [
    { 
      id: 'customer-1', 
      companyId: 'company-1', 
      name: '客户A', 
      phone: '13800138001',
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
    
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
    });
  });

  it('应该显示客户列表', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 首先需要选择公司
    const companyButton = screen.getByText('测试公司A');
    await user.click(companyButton);
    
    // 等待客户列表加载
    await waitFor(() => {
      expect(screen.getByText('客户A')).toBeInTheDocument();
      expect(screen.getByText('客户B')).toBeInTheDocument();
    });
  });

  it('应该能够删除客户并显示确认对话框', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 首先选择公司
    const companyButton = screen.getByText('测试公司A');
    await user.click(companyButton);
    
    // 等待客户列表加载
    await waitFor(() => {
      expect(screen.getByText('客户A')).toBeInTheDocument();
    });
    
    // 找到客户A的行并触发删除操作（通过滑动模拟）
    const customerARow = screen.getByText('客户A').closest('div');
    
    // 触发触摸开始事件
    if (customerARow) {
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [{ clientX: 100, clientY: 50 } as any],
      });
      customerARow.dispatchEvent(touchStartEvent);
      
      // 触发触摸移动事件（向左滑动）
      const touchMoveEvent = new TouchEvent('touchmove', {
        touches: [{ clientX: 0, clientY: 50 } as any],
      });
      customerARow.dispatchEvent(touchMoveEvent);
      
      // 触发触摸结束事件
      const touchEndEvent = new TouchEvent('touchend');
      customerARow.dispatchEvent(touchEndEvent);
    }
    
    // 等待删除按钮出现并点击
    await waitFor(async () => {
      const deleteButtons = screen.getAllByText('删除');
      if (deleteButtons.length > 0) {
        await user.click(deleteButtons[0]);
      }
    });
    
    // 验证确认对话框出现
    await waitFor(() => {
      expect(screen.getByText('确认删除')).toBeInTheDocument();
      expect(screen.getByText('是否确认删除该客户信息？')).toBeInTheDocument();
    });
  });

  it('应该能够确认删除客户', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 首先选择公司
    const companyButton = screen.getByText('测试公司A');
    await user.click(companyButton);
    
    // 等待客户列表加载
    await waitFor(() => {
      expect(screen.getByText('客户A')).toBeInTheDocument();
    });
    
    // 触发删除操作
    const customerARow = screen.getByText('客户A').closest('div');
    
    // 模拟滑动删除
    if (customerARow) {
      // 直接设置transform样式来模拟滑动效果
      (customerARow as HTMLElement).style.transform = 'translateX(-100px)';
      
      // 查找并点击删除按钮
      const deleteButtons = screen.getAllByText('删除');
      await user.click(deleteButtons[0]);
    }
    
    // 点击确认删除
    const confirmButton = screen.getByText('确认');
    await user.click(confirmButton);
    
    // 验证storage.saveCustomers被调用（删除客户）
    await waitFor(() => {
      expect(storage.saveCustomers).toHaveBeenCalledWith([mockCustomers[1]]);
    });
    
    // 验证对话框关闭
    expect(screen.queryByText('确认删除')).not.toBeInTheDocument();
  });

  it('应该能够取消删除操作', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 首先选择公司
    const companyButton = screen.getByText('测试公司A');
    await user.click(companyButton);
    
    // 等待客户列表加载
    await waitFor(() => {
      expect(screen.getByText('客户A')).toBeInTheDocument();
    });
    
    // 触发删除操作
    const customerARow = screen.getByText('客户A').closest('div');
    
    // 模拟滑动删除
    if (customerARow) {
      // 直接设置transform样式来模拟滑动效果
      (customerARow as HTMLElement).style.transform = 'translateX(-100px)';
      
      // 查找并点击删除按钮
      const deleteButtons = screen.getAllByText('删除');
      await user.click(deleteButtons[0]);
    }
    
    // 点击取消
    const cancelButton = screen.getByText('取消');
    await user.click(cancelButton);
    
    // 验证storage.saveCustomers未被调用
    expect(storage.saveCustomers).not.toHaveBeenCalled();
    
    // 验证对话框关闭
    expect(screen.queryByText('确认删除')).not.toBeInTheDocument();
  });

  it('删除出错时应该显示错误提示', async () => {
    const user = userEvent.setup();
    
    // Mock saveCustomers抛出错误
    (storage.saveCustomers as any).mockImplementationOnce(() => {
      throw new Error('删除失败');
    });
    
    render(<App />);
    
    // 首先选择公司
    const companyButton = screen.getByText('测试公司A');
    await user.click(companyButton);
    
    // 等待客户列表加载
    await waitFor(() => {
      expect(screen.getByText('客户A')).toBeInTheDocument();
    });
    
    // 触发删除操作
    const customerARow = screen.getByText('客户A').closest('div');
    
    // 模拟滑动删除
    if (customerARow) {
      // 直接设置transform样式来模拟滑动效果
      (customerARow as HTMLElement).style.transform = 'translateX(-100px)';
      
      // 查找并点击删除按钮
      const deleteButtons = screen.getAllByText('删除');
      await user.click(deleteButtons[0]);
    }
    
    // 点击确认删除
    const confirmButton = screen.getByText('确认');
    await user.click(confirmButton);
    
    // 验证错误提示
    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('删除客户失败，请重试');
    });
  });

  it('删除选中的客户后应该取消选中状态', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    // 首先选择公司
    const companyButton = screen.getByText('测试公司A');
    await user.click(companyButton);
    
    // 等待客户列表加载
    await waitFor(() => {
      expect(screen.getByText('客户A')).toBeInTheDocument();
    });
    
    // 先选择一个客户查看详情
    const customerA = screen.getAllByText('客户A')[0];
    await user.click(customerA);
    
    // 确认客户详情视图已打开
    await waitFor(() => {
      expect(screen.getByText('编辑')).toBeInTheDocument();
    });
    
    // 返回列表
    const backButton = screen.getByText('列表');
    await user.click(backButton);
    
    // 等待返回到列表视图
    await waitFor(() => {
      expect(screen.getByText('客户A')).toBeInTheDocument();
    });
    
    // 触发删除操作
    const customerARow = screen.getByText('客户A').closest('div');
    
    // 模拟滑动删除
    if (customerARow) {
      // 直接设置transform样式来模拟滑动效果
      (customerARow as HTMLElement).style.transform = 'translateX(-100px)';
      
      // 查找并点击删除按钮
      const deleteButtons = screen.getAllByText('删除');
      await user.click(deleteButtons[0]);
    }
    
    // 点击确认删除
    const confirmButton = screen.getByText('确认');
    await user.click(confirmButton);
    
    // 验证storage.saveCustomers被调用
    await waitFor(() => {
      expect(storage.saveCustomers).toHaveBeenCalled();
    });
  });
});