import { Company, Customer, Department } from '../types';
// @ts-ignore - 忽略xlsx模块的类型声明问题
import * as XLSX from 'xlsx';

// 导出状态枚举
export enum ExportStatus {
  IDLE = 'idle',
  EXPORTING = 'exporting',
  SUCCESS = 'success',
  ERROR = 'error'
}

// Excel导出服务
export const excelService = {
  /**
   * 导出公司客户数据到Excel
   * @param company 公司信息
   * @param customers 客户列表
   * @param departments 部门列表
   * @returns 导出状态
   */
  exportCompanyCustomers: async (
    company: Company, 
    customers: Customer[], 
    departments: Department[]
  ): Promise<{ status: ExportStatus, message?: string }> => {
    try {
      // 准备导出数据
      const data = customers.map(c => ({
        '姓名': c.name,
        '电话': c.phone || '',
        '邮箱': c.email || '',
        '部门': departments.find(d => d.id === c.departmentId)?.name || '',
        '职务': c.jobTitle || '',
        '直属上级': customers.find(mgr => mgr.id === c.managerId)?.name || '',
        '籍贯': c.hometown || '',
        '合作状态': excelService.getCooperationStatusText(c.status || 0),
        '爱好': c.hobbies || '',
        '家庭情况': c.familyInfo || '',
        '备注': c.notes || ''
      }));

      // 如果没有数据，创建示例数据模板
      if (data.length === 0) {
        data.push({
          '姓名': '示例用户',
          '电话': '13800000000',
          '邮箱': 'example@test.com',
          '部门': '销售部',
          '职务': '经理',
          '直属上级': '',
          '籍贯': '广东省-深圳市-南山区',
          '合作状态': '深度',
          '爱好': '阅读、旅游',
          '家庭情况': '已婚，有一个孩子',
          '备注': '这是一个示例数据'
        });
      }

      // 创建工作簿和工作表
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "客户数据");

      // 设置列宽
      const colWidths = [
        { wch: 10 }, // 姓名
        { wch: 15 }, // 电话
        { wch: 25 }, // 邮箱
        { wch: 15 }, // 部门
        { wch: 15 }, // 职务
        { wch: 15 }, // 直属上级
        { wch: 25 }, // 籍贯
        { wch: 10 }, // 合作状态
        { wch: 20 }, // 爱好
        { wch: 30 }, // 家庭情况
        { wch: 30 }  // 备注
      ];
      ws['!cols'] = colWidths;

      // 格式化日期
      const currentDate = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
      const fileName = `${company.name}_客户导出_${currentDate}.xlsx`;

      // 导出文件
      XLSX.writeFile(wb, fileName);

      return { status: ExportStatus.SUCCESS, message: `成功导出${data.length}条客户数据` };
    } catch (error) {
      console.error('Excel导出失败:', error);
      return { status: ExportStatus.ERROR, message: '导出失败，请重试' };
    }
  },

  /**
   * 将合作状态数字转换为文本
   */
  getCooperationStatusText(status: number): string {
    switch (status) {
      case -2: return '中止';
      case -1: return '潜在';
      case 0: return '初步';
      case 1: return '深入';
      case 2: return '深度';
      default: return '未知';
    }
  }
};