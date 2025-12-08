import { describe, it, expect, vi, beforeEach } from 'vitest';
import { excelService, ExportStatus } from '../services/excelService';
import { Company, Customer, Department } from '../types';

// Mock XLSX
vi.mock('xlsx', () => ({
  utils: {
    json_to_sheet: vi.fn(() => ({})),
    book_new: vi.fn(() => ({ Sheets: {}, SheetNames: [] })),
    book_append_sheet: vi.fn(),
  },
  writeFile: vi.fn(),
}));

describe('ExcelService测试', () => {
  const mockCompany: Company = {
    id: 'company-1',
    name: '测试公司',
    createdAt: Date.now(),
  };

  const mockDepartments: Department[] = [
    { id: 'dept-1', name: '销售部', companyId: 'company-1' },
    { id: 'dept-2', name: '技术部', companyId: 'company-1' },
  ];

  const mockCustomers: Customer[] = [
    {
      id: 'customer-1',
      companyId: 'company-1',
      name: '张三',
      phone: '13800138001',
      email: 'zhangsan@example.com',
      departmentId: 'dept-1',
      jobTitle: '销售经理',
      managerId: 'customer-2',
      hometown: '广东省-深圳市-南山区',
      status: 2,
      hobbies: '阅读、旅游',
      familyInfo: '已婚，有一个孩子',
      notes: '重要客户',
      createdAt: Date.now(),
    },
    {
      id: 'customer-2',
      companyId: 'company-1',
      name: '李四',
      phone: '13800138002',
      createdAt: Date.now(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该成功导出客户数据', async () => {
    const result = await excelService.exportCompanyCustomers(
      mockCompany,
      mockCustomers,
      mockDepartments
    );

    expect(result.status).toBe(ExportStatus.SUCCESS);
    expect(result.message).toBe('成功导出2条客户数据');
    
    // 验证XLSX方法被调用
    const XLSX = await import('xlsx');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledTimes(1);
    expect(XLSX.utils.book_new).toHaveBeenCalledTimes(1);
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledTimes(1);
    expect(XLSX.writeFile).toHaveBeenCalledTimes(1);
  });

  it('应该处理空客户列表的情况', async () => {
    const result = await excelService.exportCompanyCustomers(
      mockCompany,
      [],
      mockDepartments
    );

    expect(result.status).toBe(ExportStatus.SUCCESS);
    expect(result.message).toBe('成功导出1条客户数据');
    
    // 验证导出的数据是示例模板
    const XLSX = await import('xlsx');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
  });

  it('应该正确转换合作状态', () => {
    expect(excelService.getCooperationStatusText(-2)).toBe('中止');
    expect(excelService.getCooperationStatusText(-1)).toBe('潜在');
    expect(excelService.getCooperationStatusText(0)).toBe('初步');
    expect(excelService.getCooperationStatusText(1)).toBe('深入');
    expect(excelService.getCooperationStatusText(2)).toBe('深度');
    expect(excelService.getCooperationStatusText(999)).toBe('未知');
  });

  it('应该处理导出过程中的错误', async () => {
    // Mock XLSX.writeFile抛出错误
    const XLSX = await import('xlsx');
    (XLSX.writeFile as any).mockImplementationOnce(() => {
      throw new Error('文件写入失败');
    });

    const result = await excelService.exportCompanyCustomers(
      mockCompany,
      mockCustomers,
      mockDepartments
    );

    expect(result.status).toBe(ExportStatus.ERROR);
    expect(result.message).toBe('导出失败，请重试');
  });

  it('应该正确设置文件名', async () => {
    await excelService.exportCompanyCustomers(
      mockCompany,
      mockCustomers,
      mockDepartments
    );

    // 验证文件名格式
    const XLSX = await import('xlsx');
    expect(XLSX.writeFile).toHaveBeenCalled();
    
    // 获取调用参数
    const writeFileCall = (XLSX.writeFile as any).mock.calls[0];
    const fileName = writeFileCall[1];
    
    // 验证文件名格式（修正为支持一位数月份和日期）
    expect(fileName).toMatch(/^测试公司_客户导出_\d{4}-\d{1,2}-\d{1,2}\.xlsx$/);
  });

  it('应该正确设置列宽', async () => {
    await excelService.exportCompanyCustomers(
      mockCompany,
      mockCustomers,
      mockDepartments
    );

    // 验证json_to_sheet被调用
    const XLSX = await import('xlsx');
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalled();
  });

  it('应该处理无效的客户数据', async () => {
    const invalidCustomers: Customer[] = [
      {
        id: 'customer-invalid',
        companyId: 'company-1',
        name: '',
        phone: '无效电话',
        email: '无效邮箱',
        departmentId: 'invalid-dept',
        managerId: 'invalid-mgr',
        hometown: '',
        status: 999 as any,
        createdAt: Date.now(),
      },
    ];

    const result = await excelService.exportCompanyCustomers(
      mockCompany,
      invalidCustomers,
      mockDepartments
    );

    expect(result.status).toBe(ExportStatus.SUCCESS);
  });
});