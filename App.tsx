import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Company, Customer, Department, CooperationStatus } from './types';
import { locationService } from './data/locations';
import { storage, generateId } from './services/storage';
import { excelService, ExportStatus } from './services/excelService';
import { IconPlus, IconChevronLeft, IconPhone, IconUsers, IconList, IconGitMerge, IconCamera, IconSearch, IconTrash, IconBriefcase, IconShare, IconDownload } from './components/Icons';
import { OrgChart } from './components/OrgChart';
import { SwipeableCustomerCard } from './components/SwipeableCustomerCard';
import * as XLSX from 'xlsx';

// --- Components ---

// 1. Company Selection
const CompanySelector = ({ onSelect }: { onSelect: (c: Company) => void }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [shouldExportOnDelete, setShouldExportOnDelete] = useState(true);

  useEffect(() => {
    setCompanies(storage.getCompanies());
  }, []);

  const handleCreate = () => {
    if (!newCompanyName.trim()) return;
    const newCompany: Company = {
      id: generateId(),
      name: newCompanyName,
      createdAt: Date.now()
    };
    const updated = [...companies, newCompany];
    storage.saveCompanies(updated);
    setCompanies(updated);
    setNewCompanyName('');
    setIsAdding(false);
  };

  const handleLongPress = (company: Company) => {
    setCompanyToDelete(company);
    setShowDeleteDialog(true);
    setShouldExportOnDelete(true);
  };

  const handleDeleteCompany = () => {
    if (!companyToDelete) return;
    
    try {
      // 导出Excel（如果勾选）
      if (shouldExportOnDelete) {
        const allCustomers = storage.getCustomers();
        const allDepartments = storage.getDepartments();
        const companyCustomers = allCustomers.filter(c => c.companyId === companyToDelete.id);
        
        const data = companyCustomers.map(c => ({
          '姓名': c.name,
          '电话': c.phone || '',
          '邮箱': c.email || '',
          '部门': allDepartments.find(d => d.id === c.departmentId)?.name || '',
          '职务': c.jobTitle || '',
          '直属上级': allCustomers.find(mgr => mgr.id === c.managerId)?.name || '',
          '籍贯': c.hometown || '',
          '合作状态': c.status || 0,
          '爱好': c.hobbies || '',
          '家庭情况': c.familyInfo || '',
          '备注': c.notes || ''
        }));

        if (data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, "客户数据");
          XLSX.writeFile(wb, `${companyToDelete.name}_客户导出_${new Date().toLocaleDateString()}.xlsx`);
        }
      }
      
      // 删除公司
      const updatedCompanies = companies.filter(c => c.id !== companyToDelete.id);
      storage.saveCompanies(updatedCompanies);
      setCompanies(updatedCompanies);
      
      // 删除该公司下的所有客户和部门
      const allCustomers = storage.getCustomers();
      const allDepartments = storage.getDepartments();
      
      const updatedCustomers = allCustomers.filter(c => c.companyId !== companyToDelete.id);
      const updatedDepartments = allDepartments.filter(d => d.companyId !== companyToDelete.id);
      
      storage.saveCustomers(updatedCustomers);
      storage.saveDepartments(updatedDepartments);
      
      setShowDeleteDialog(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('删除公司时出错:', error);
      alert('删除公司失败，请重试');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-ios-bg p-6 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]">
      <h1 className="text-3xl font-bold text-gray-900 mb-2 mt-8">选择公司</h1>
      <p className="text-gray-500 mb-8">管理您的客户资源库</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {companies.map(c => (
          <div
            key={c.id}
            className="relative"
            onTouchStart={() => {
              const timer = setTimeout(() => handleLongPress(c), 500);
              const clearTimer = () => clearTimeout(timer);
              const element = document.currentScript;
              if (element) {
                element.addEventListener('touchend', clearTimer);
                element.addEventListener('touchmove', clearTimer);
                element.addEventListener('touchcancel', clearTimer);
              }
            }}
            onMouseDown={() => {
              const timer = setTimeout(() => handleLongPress(c), 500);
              const clearTimer = () => clearTimeout(timer);
              const element = document.currentScript;
              if (element) {
                element.addEventListener('mouseup', clearTimer);
                element.addEventListener('mouseleave', clearTimer);
              }
            }}
          >
            <button
              onClick={() => onSelect(c)}
              className="bg-white p-6 rounded-2xl shadow-sm text-left active:scale-95 transition-transform w-full"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg text-gray-800 truncate">{c.name}</span>
                <IconChevronLeft className="rotate-180 text-gray-300 w-5 h-5" />
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleLongPress(c);
              }}
              className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
              aria-label="删除公司"
            >
              <IconTrash className="w-4 h-4" />
            </button>
          </div>
        ))}
        
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-white border-2 border-dashed border-gray-300 p-6 rounded-2xl text-center text-gray-400 flex flex-col items-center justify-center gap-2 active:bg-gray-50"
        >
          <IconPlus className="w-8 h-8" />
          <span>创建新公司</span>
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4">创建新公司</h3>
            <input 
              autoFocus
              value={newCompanyName}
              onChange={e => setNewCompanyName(e.target.value)}
              placeholder="输入公司名称"
              className="w-full bg-gray-100 p-3 rounded-xl mb-6 outline-none focus:ring-2 focus:ring-ios-blue/50"
            />
            <div className="flex gap-3">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium">取消</button>
              <button onClick={handleCreate} className="flex-1 py-3 bg-ios-blue text-white rounded-xl font-medium">创建</button>
            </div>
          </div>
        </div>
      )}

      {/* 公司删除确认对话框 */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 text-gray-900">确认删除</h3>
            <p className="text-gray-600 mb-6">
              该公司内的所有客户信息将被删除，是否确认操作？
            </p>
            
            <div className="flex items-center mb-6">
              <input
                type="checkbox"
                id="export-checkbox"
                checked={shouldExportOnDelete}
                onChange={(e) => setShouldExportOnDelete(e.target.checked)}
                className="mr-2 h-4 w-4 text-ios-blue focus:ring-ios-blue border-gray-300 rounded"
              />
              <label htmlFor="export-checkbox" className="text-sm text-gray-700">
                在删除时同步导出一份Excel表格数据
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setCompanyToDelete(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium"
              >
                取消
              </button>
              <button
                onClick={handleDeleteCompany}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. Import / Export View
interface ImportExportProps {
  company: Company;
  customers: Customer[];
  departments: Department[];
  onImportComplete: () => void;
}

const ImportExportView = ({ company, customers, departments, onImportComplete }: ImportExportProps) => {
  
  const handleExport = () => {
    // Flatten data for Excel
    const data = customers.map(c => ({
      '姓名': c.name,
      '电话': c.phone || '',
      '邮箱': c.email || '',
      '部门': departments.find(d => d.id === c.departmentId)?.name || '',
      '职务': c.jobTitle || '',
      '直属上级': customers.find(mgr => mgr.id === c.managerId)?.name || '',
      '籍贯': c.hometown || '',
      '合作状态': c.status || 0,
      '爱好': c.hobbies || '',
      '家庭情况': c.familyInfo || '',
      '备注': c.notes || ''
    }));

    if (data.length === 0) {
      data.push({'姓名': '示例用户', '电话': '13800000000', '邮箱': 'example@test.com', '部门': '销售部', '职务': '经理', '直属上级': '', '籍贯': '广东省-深圳市-南山区', '合作状态': 0, '爱好': '', '家庭情况': '', '备注': ''});
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "客户数据");
    XLSX.writeFile(wb, `${company.name}_客户导出_${new Date().toLocaleDateString()}.xlsx`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      processImportData(data);
    };
    reader.readAsBinaryString(file);
  };

  const processImportData = (rows: any[]) => {
    let newDepts = [...departments];
    let newCustomers = [...customers];
    
    // Helper to find or create dept
    const getDeptId = (name: string): string | undefined => {
      if (!name) return undefined;
      const cleanName = name.trim();
      let d = newDepts.find(dp => dp.name === cleanName);
      if (!d) {
        d = { id: generateId(), name: cleanName, companyId: company.id };
        newDepts.push(d);
      }
      return d.id;
    };

    // 1. First pass: Create all customers with basic info
    // We map Name -> ID to handle relations later
    const nameToIdMap = new Map<string, string>();
    customers.forEach(c => nameToIdMap.set(c.name, c.id));

    const rowsToProcess: any[] = [];

    rows.forEach((row: any) => {
      const name = row['姓名'];
      if (!name) return;
      
      let id = nameToIdMap.get(name);
      if (!id) {
        id = generateId();
        nameToIdMap.set(name, id);
      }
      rowsToProcess.push({ ...row, _generatedId: id });
    });

    // 2. Build Objects
    rowsToProcess.forEach(row => {
      const name = row['姓名'];
      const id = row._generatedId;
      
      const deptId = getDeptId(row['部门']);
      
      // Upsert logic
      const existingIdx = newCustomers.findIndex(c => c.id === id);
      const customerObj: Customer = {
        id: id,
        companyId: company.id,
        name: name,
        phone: row['电话'] ? String(row['电话']) : undefined,
        email: row['邮箱'] || undefined,
        departmentId: deptId,
        jobTitle: row['职务'] || undefined,
        hometown: row['籍贯'] || undefined,
        status: row['合作状态'] ? Number(row['合作状态']) as CooperationStatus : 0,
        hobbies: row['爱好'] || undefined,
        familyInfo: row['家庭情况'] || undefined,
        notes: row['备注'] || undefined,
        createdAt: Date.now(),
        // Keep existing photo if updating
        photo: existingIdx >= 0 ? newCustomers[existingIdx].photo : undefined
      };

      if (existingIdx >= 0) {
        // Retain manager ID for now, update later
        customerObj.managerId = newCustomers[existingIdx].managerId;
        newCustomers[existingIdx] = customerObj;
      } else {
        newCustomers.push(customerObj);
      }
    });

    // 3. Second pass: Link Managers
    rowsToProcess.forEach(row => {
      const id = row._generatedId;
      const managerName = row['直属上级'];
      if (managerName) {
        // Try to find manager in our map (which includes newly created people)
        let managerId = nameToIdMap.get(managerName.trim());
        
        // Auto-create Ghost Manager if not exists in Excel
        if (!managerId) {
           managerId = generateId();
           const ghostManager: Customer = {
             id: managerId,
             companyId: company.id,
             name: managerName.trim(),
             createdAt: Date.now(),
             status: 0,
             notes: '导入时自动创建的上级'
           };
           newCustomers.push(ghostManager);
           nameToIdMap.set(managerName.trim(), managerId);
        }

        const idx = newCustomers.findIndex(c => c.id === id);
        if (idx >= 0) {
          newCustomers[idx].managerId = managerId;
        }
      }
    });

    // Save
    storage.saveDepartments(newDepts);
    storage.saveCustomers(newCustomers);
    onImportComplete();
    alert(`成功导入 ${rowsToProcess.length} 条数据`);
  };

  return (
    <div className="flex flex-col h-full bg-ios-bg p-6 animate-in slide-in-from-bottom-10">
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">数据导出</h2>
        <p className="text-gray-500 text-sm mb-4">将当前公司的所有客户数据（不含照片）导出为 Excel 表格。</p>
        <button 
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 bg-ios-blue text-white font-semibold py-3 rounded-xl active:scale-95 transition-transform"
        >
          <IconShare className="w-5 h-5" />
          导出 Excel
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">数据导入</h2>
        <p className="text-gray-500 text-sm mb-4">
          支持批量导入或更新客户。系统将根据“姓名”自动匹配现有客户，根据“部门”和“直属上级”自动创建关联。
        </p>
        
        <div className="flex gap-4 mb-4">
          <button 
            onClick={handleExport} // Re-use export as template download
            className="flex-1 py-2 text-ios-blue bg-blue-50 rounded-lg text-sm font-medium"
          >
            下载模版
          </button>
        </div>

        <label className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 text-gray-500 font-semibold py-8 rounded-xl cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors">
          <IconDownload className="w-6 h-6" />
          <span>点击上传 Excel 文件</span>
          <input type="file" accept=".xlsx, .xls" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>
    </div>
  );
};


// 3. Customer Form
interface CustomerFormProps {
  companyId: string;
  initialData?: Customer;
  allCustomers: Customer[];
  allDepartments: Department[];
  onSave: (c: Customer, newDept?: Department, newManager?: Customer) => void;
  onCancel: () => void;
}

const CustomerForm = ({ companyId, initialData, allCustomers, allDepartments, onSave, onCancel }: CustomerFormProps) => {
  const [formData, setFormData] = useState<Partial<Customer>>(initialData || { companyId, status: 0 });
  
  // Custom Inputs Logic
  const [deptSearch, setDeptSearch] = useState('');
  const [managerSearch, setManagerSearch] = useState('');
  const [deptOptionsVisible, setDeptOptionsVisible] = useState(false);
  const [managerOptionsVisible, setManagerOptionsVisible] = useState(false);
  
  // Hometown Logic
  const [hometownSearch, setHometownSearch] = useState('');
  const [showHometownResults, setShowHometownResults] = useState(false);
  const [locationResults, setLocationResults] = useState<string[]>([]);
  const [isLocationsLoading, setIsLocationsLoading] = useState(false);

  // Initialize Location Service & Pre-fill data
  useEffect(() => {
    // Load Location Service
    const loadLocations = async () => {
       setIsLocationsLoading(true);
       await locationService.init();
       setIsLocationsLoading(false);
    };
    loadLocations();

    // Pre-fill form fields
    if (initialData?.departmentId) {
       const d = allDepartments.find(d => d.id === initialData.departmentId);
       if (d) setDeptSearch(d.name);
    }
    if (initialData?.managerId) {
        const m = allCustomers.find(c => c.id === initialData.managerId);
        if (m) setManagerSearch(m.name);
    }
    if (initialData?.hometown) {
        setHometownSearch(initialData.hometown);
    }
  }, [initialData, allDepartments, allCustomers]);

  // Hometown Search Handler
  const handleHometownSearch = async (val: string) => {
      setHometownSearch(val);
      setFormData({...formData, hometown: val});
      if (val.length > 0) {
          setIsLocationsLoading(true);
          const results = await locationService.search(val);
          setLocationResults(results);
          setIsLocationsLoading(false);
          setShowHometownResults(true);
      } else {
          setShowHometownResults(false);
      }
  };

  // Photo Handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, photo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!formData.name) {
        alert('请输入姓名');
        return;
    }

    // 1. Handle Department (Select existing or Create new)
    let finalDeptId = formData.departmentId;
    let newDeptObj: Department | undefined;
    
    if (deptSearch.trim()) {
        const existingDept = allDepartments.find(d => d.name === deptSearch.trim());
        if (existingDept) {
            finalDeptId = existingDept.id;
        } else {
            // Create New Department
            newDeptObj = {
                id: generateId(),
                name: deptSearch.trim(),
                companyId
            };
            finalDeptId = newDeptObj.id;
        }
    } else {
        finalDeptId = undefined;
    }

    // 2. Handle Manager (Select existing or Create new)
    let finalManagerId = formData.managerId;
    let newManagerObj: Customer | undefined;

    if (managerSearch.trim()) {
        const existingManager = allCustomers.find(c => c.name === managerSearch.trim());
        if (existingManager) {
            finalManagerId = existingManager.id;
        } else {
            // Create New Manager Customer (Ghost user)
            newManagerObj = {
                id: generateId(),
                companyId,
                name: managerSearch.trim(),
                createdAt: Date.now(),
                status: 0,
                notes: '自动创建的直属上级'
            };
            finalManagerId = newManagerObj.id;
        }
    } else {
        finalManagerId = undefined;
    }

    onSave({
        ...formData,
        id: formData.id || generateId(),
        createdAt: formData.createdAt || Date.now(),
        departmentId: finalDeptId,
        managerId: finalManagerId,
        name: formData.name!
    } as Customer, newDeptObj, newManagerObj);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ios-bg flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
      <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-gray-200">
        <button onClick={onCancel} className="text-ios-blue text-base">取消</button>
        <span className="font-semibold text-lg">{initialData ? '编辑客户' : '新客户'}</span>
        <button onClick={handleSave} className="text-ios-blue font-bold text-base">保存</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Photo Section */}
        <div className="flex justify-center mb-6">
          <div className="relative">
             <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                {formData.photo ? (
                    <img src={formData.photo} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                    <IconCamera className="text-gray-400 w-8 h-8" />
                )}
             </div>
             <input type="file" accept="image/*" onChange={handlePhotoUpload} className="absolute inset-0 opacity-0 z-10 w-full h-full" />
             {formData.photo && (
                 <button 
                    onClick={() => setFormData({...formData, photo: undefined})}
                    className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md border border-gray-100 z-20"
                 >
                     <IconTrash className="w-4 h-4 text-ios-red" />
                 </button>
             )}
          </div>
        </div>

        <div className="space-y-6 max-w-lg mx-auto">
            {/* Basic Info Group */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                <div className="flex items-center px-4 py-3 border-b border-gray-100">
                    <span className="w-24 text-gray-900">姓名 <span className="text-red-500">*</span></span>
                    <input 
                        className="flex-1 outline-none text-gray-900 placeholder-gray-400" 
                        placeholder="必填"
                        value={formData.name || ''}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                </div>
                <div className="flex items-center px-4 py-3 border-b border-gray-100">
                    <span className="w-24 text-gray-900">电话</span>
                    <input 
                        className="flex-1 outline-none text-gray-900 placeholder-gray-400" 
                        type="tel"
                        value={formData.phone || ''}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
                 <div className="flex items-center px-4 py-3">
                    <span className="w-24 text-gray-900">邮箱</span>
                    <input 
                        className="flex-1 outline-none text-gray-900 placeholder-gray-400" 
                        type="email"
                        value={formData.email || ''}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                </div>
            </div>

            {/* Org Info Group */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                {/* Department Auto-Complete */}
                <div className="flex items-center px-4 py-3 border-b border-gray-100 relative">
                    <span className="w-24 text-gray-900">所属部门</span>
                    <input 
                        className="flex-1 outline-none text-gray-900 placeholder-gray-400"
                        placeholder="选择或输入新建"
                        value={deptSearch}
                        onChange={e => { setDeptSearch(e.target.value); setDeptOptionsVisible(true); }}
                        onFocus={() => setDeptOptionsVisible(true)}
                        onBlur={() => setTimeout(() => setDeptOptionsVisible(false), 200)}
                    />
                    {deptOptionsVisible && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl max-h-40 overflow-y-auto z-20 rounded-b-xl">
                            {allDepartments.filter(d => d.name.includes(deptSearch)).map(d => (
                                <div key={d.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer" 
                                    onMouseDown={() => { setDeptSearch(d.name); setFormData({...formData, departmentId: d.id}); }}>
                                    {d.name}
                                </div>
                            ))}
                            {deptSearch && !allDepartments.find(d => d.name === deptSearch) && (
                                <div className="px-4 py-2 text-ios-blue italic text-sm border-t border-gray-100">
                                    新增部门: "{deptSearch}"
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center px-4 py-3 border-b border-gray-100">
                    <span className="w-24 text-gray-900">职务</span>
                    <input 
                        className="flex-1 outline-none text-gray-900 placeholder-gray-400"
                        value={formData.jobTitle || ''}
                        onChange={e => setFormData({...formData, jobTitle: e.target.value})}
                    />
                </div>

                {/* Manager Auto-Complete */}
                <div className="flex items-center px-4 py-3 relative">
                    <span className="w-24 text-gray-900">直属上级</span>
                    <input 
                        className="flex-1 outline-none text-gray-900 placeholder-gray-400"
                        placeholder="搜索姓名 (自动创建新用户)"
                        value={managerSearch}
                        onChange={e => { setManagerSearch(e.target.value); setManagerOptionsVisible(true); }}
                        onFocus={() => setManagerOptionsVisible(true)}
                        onBlur={() => setTimeout(() => setManagerOptionsVisible(false), 200)}
                    />
                     {managerOptionsVisible && managerSearch && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl max-h-40 overflow-y-auto z-20 rounded-b-xl">
                            {allCustomers.filter(c => c.name.includes(managerSearch) && c.id !== formData.id).map(c => (
                                <div key={c.id} className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                                    onMouseDown={() => { setManagerSearch(c.name); setFormData({...formData, managerId: c.id}); }}>
                                    {c.name} <span className="text-gray-400 text-xs">({c.jobTitle || '无职务'})</span>
                                </div>
                            ))}
                            {!allCustomers.find(c => c.name === managerSearch) && (
                                <div className="px-4 py-2 text-ios-blue italic text-sm border-t border-gray-100">
                                    自动创建上级: "{managerSearch}"
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                {/* Hometown Search */}
                <div className="flex items-center px-4 py-3 border-b border-gray-100 relative">
                    <span className="w-24 text-gray-900">籍贯</span>
                    <input 
                        className="flex-1 outline-none text-gray-900 placeholder-gray-400"
                        placeholder={isLocationsLoading ? "加载数据库中..." : "输入省/市搜索"}
                        value={hometownSearch}
                        onChange={e => handleHometownSearch(e.target.value)}
                        onFocus={() => { if(hometownSearch) setShowHometownResults(true); }}
                        onBlur={() => setTimeout(() => setShowHometownResults(false), 200)}
                    />
                    {showHometownResults && locationResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-xl max-h-60 overflow-y-auto z-20 rounded-b-xl">
                            {locationResults.map((loc, idx) => (
                                <div key={idx} className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer text-sm"
                                    onMouseDown={() => {
                                        setHometownSearch(loc);
                                        setFormData({...formData, hometown: loc});
                                        setShowHometownResults(false);
                                    }}>
                                    {loc}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center px-4 py-3 border-b border-gray-100">
                    <span className="w-24 text-gray-900">爱好</span>
                    <input 
                        className="flex-1 outline-none text-gray-900 placeholder-gray-400"
                        value={formData.hobbies || ''}
                        onChange={e => setFormData({...formData, hobbies: e.target.value})}
                    />
                </div>
                
                 <div className="px-4 py-3 border-b border-gray-100">
                    <div className="mb-2 text-gray-900">家庭情况</div>
                    <textarea 
                        className="w-full outline-none text-gray-900 placeholder-gray-400 resize-none h-20 bg-gray-50 p-2 rounded-lg"
                        value={formData.familyInfo || ''}
                        onChange={e => setFormData({...formData, familyInfo: e.target.value})}
                    />
                </div>

                <div className="px-4 py-3">
                    <div className="mb-2 text-gray-900">备注</div>
                    <textarea 
                        className="w-full outline-none text-gray-900 placeholder-gray-400 resize-none h-20 bg-gray-50 p-2 rounded-lg"
                        value={formData.notes || ''}
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                    />
                </div>
            </div>

            {/* Status Status */}
             <div className="bg-white rounded-xl overflow-hidden shadow-sm p-4">
                 <span className="text-gray-900 block mb-3">合作状态</span>
                 <div className="flex justify-between gap-1">
                     {[-2, -1, 0, 1, 2].map((s) => (
                         <button
                            key={s}
                            onClick={() => setFormData({...formData, status: s as CooperationStatus})}
                            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                                formData.status === s 
                                ? 'bg-ios-blue text-white shadow-md' 
                                : 'bg-gray-100 text-gray-500'
                            }`}
                         >
                             {s}
                         </button>
                     ))}
                 </div>
                 <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
                     <span>中止</span>
                     <span>潜在</span>
                     <span>深度</span>
                 </div>
             </div>
        </div>
        <div className="h-20" /> {/* Spacer */}
      </div>
    </div>
  );
};

// --- Main App Component ---

const App = () => {
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [view, setView] = useState<'LIST' | 'CHART' | 'IMPORT_EXPORT'>('LIST');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [editingCustomer, setEditingCustomer] = useState<Customer | undefined | null>(null); // null=none, undefined=new
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [showCustomerDeleteDialog, setShowCustomerDeleteDialog] = useState(false);

  // Load Data
  useEffect(() => {
    setCustomers(storage.getCustomers());
    setDepartments(storage.getDepartments());
  }, []);

  // Filter Data
  const companyCustomers = useMemo(() => 
    customers.filter(c => c.companyId === activeCompany?.id)
  , [customers, activeCompany]);

  const companyDepartments = useMemo(() => 
    departments.filter(d => d.companyId === activeCompany?.id)
  , [departments, activeCompany]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return companyCustomers;
    const lower = searchTerm.toLowerCase();
    return companyCustomers.filter(c => 
        c.name.toLowerCase().includes(lower) || 
        c.jobTitle?.toLowerCase().includes(lower) ||
        departments.find(d => d.id === c.departmentId)?.name.toLowerCase().includes(lower)
    );
  }, [companyCustomers, searchTerm, departments]);

  const handleSaveCustomer = (customer: Customer, newDept?: Department, newManager?: Customer) => {
    let updatedCustomers = [...customers];
    let updatedDepts = [...departments];

    if (newDept) {
        updatedDepts.push(newDept);
        storage.saveDepartments(updatedDepts);
        setDepartments(updatedDepts);
    }
    
    if (newManager) {
        updatedCustomers.push(newManager);
    }

    const exists = updatedCustomers.findIndex(c => c.id === customer.id);
    if (exists >= 0) {
        updatedCustomers[exists] = customer;
    } else {
        updatedCustomers.push(customer);
    }

    storage.saveCustomers(updatedCustomers);
    setCustomers(updatedCustomers);
    setEditingCustomer(null);
  };

  const handleImportComplete = () => {
     setCustomers(storage.getCustomers());
     setDepartments(storage.getDepartments());
     setView('LIST');
  };


  const handleDeleteCustomer = () => {
    if (!customerToDelete) return;
    
    try {
      const updatedCustomers = customers.filter(c => c.id !== customerToDelete.id);
      storage.saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
      
      // 如果删除的是当前选中的客户，则取消选中
      if (selectedCustomerId === customerToDelete.id) {
        setSelectedCustomerId(null);
      }
      
      setShowCustomerDeleteDialog(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('删除客户时出错:', error);
      alert('删除客户失败，请重试');
    }
  };

  const selectedCustomer = useMemo(() => 
    customers.find(c => c.id === selectedCustomerId)
  , [customers, selectedCustomerId]);

  const handleBack = () => {
    if (selectedCustomerId) {
        setSelectedCustomerId(null);
        return;
    }
    if (view === 'IMPORT_EXPORT') {
        setView('LIST');
        return;
    }
    setActiveCompany(null);
  };

  if (!activeCompany) {
    return <CompanySelector onSelect={setActiveCompany} />;
  }

  return (
    <div className="max-w-screen-md mx-auto h-[100dvh] flex flex-col bg-ios-bg overflow-hidden pb-[env(safe-area-inset-bottom)]">
      {/* Navbar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] flex items-center justify-between z-10 shrink-0">
         <div className="flex items-center gap-2">
            <button onClick={handleBack} className="flex items-center text-ios-blue active:opacity-60">
                <IconChevronLeft className="w-6 h-6" />
                <span className="text-base font-medium">
                  {selectedCustomerId ? '列表' : view === 'IMPORT_EXPORT' ? '返回' : '公司'}
                </span>
            </button>
         </div>
         <span className="font-bold text-lg text-gray-900 truncate max-w-[150px]">
             {selectedCustomerId ? (selectedCustomer?.name) : view === 'IMPORT_EXPORT' ? '导入/导出' : activeCompany.name}
         </span>
         <div className="flex gap-4">
             {!selectedCustomerId && view !== 'IMPORT_EXPORT' && (
                 <>
                    <button onClick={() => setView('IMPORT_EXPORT')} className="text-ios-blue active:opacity-60">
                        <IconShare className="w-6 h-6" />
                    </button>
                    <button onClick={() => setView(view === 'LIST' ? 'CHART' : 'LIST')} className="text-ios-blue active:opacity-60">
                        {view === 'LIST' ? <IconGitMerge className="w-6 h-6" /> : <IconList className="w-6 h-6" />}
                    </button>
                    <button onClick={() => setEditingCustomer(undefined)} className="text-ios-blue active:opacity-60">
                        <IconPlus className="w-6 h-6" />
                    </button>
                 </>
             )}
             {selectedCustomerId && (
                 <button onClick={() => setEditingCustomer(selectedCustomer)} className="text-ios-blue text-base font-medium">
                     编辑
                 </button>
             )}
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
          
          {selectedCustomerId ? (
            // Detail View
            <div className="h-full overflow-y-auto p-4 animate-in slide-in-from-right-10 duration-200">
               <div className="bg-white rounded-2xl shadow-sm p-6 mb-4 flex flex-col items-center">
                   <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 overflow-hidden">
                        {selectedCustomer?.photo ? (
                            <img src={selectedCustomer.photo} className="w-full h-full object-cover"/>
                        ) : (
                            <IconUsers className="w-full h-full p-6 text-gray-400" />
                        )}
                   </div>
                   <h2 className="text-2xl font-bold text-gray-900">{selectedCustomer?.name}</h2>
                   <p className="text-gray-500 mt-1">{selectedCustomer?.jobTitle || '无职务'}</p>
                   <div className="flex gap-2 mt-4 w-full justify-center">
                       {selectedCustomer?.phone && (
                           <a href={`tel:${selectedCustomer.phone}`} className="bg-green-500 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform">
                               <IconPhone className="w-5 h-5" />
                           </a>
                       )}
                   </div>
               </div>

               <div className="space-y-4">
                   <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                       <DetailRow label="部门" value={companyDepartments.find(d => d.id === selectedCustomer?.departmentId)?.name} />
                       <DetailRow label="直属上级" value={companyCustomers.find(c => c.id === selectedCustomer?.managerId)?.name} />
                       <DetailRow label="合作状态" value={selectedCustomer?.status?.toString()} />
                   </div>

                   <div className="bg-white rounded-xl overflow-hidden shadow-sm">
                       <DetailRow label="电话" value={selectedCustomer?.phone} copyable />
                       <DetailRow label="邮箱" value={selectedCustomer?.email} copyable />
                       <DetailRow label="籍贯" value={selectedCustomer?.hometown} />
                   </div>

                   <div className="bg-white rounded-xl overflow-hidden shadow-sm p-4">
                       <h3 className="text-sm font-medium text-gray-400 mb-2">家庭情况</h3>
                       <p className="text-gray-800 whitespace-pre-wrap">{selectedCustomer?.familyInfo || '未录入'}</p>
                   </div>
                   
                   <div className="bg-white rounded-xl overflow-hidden shadow-sm p-4">
                       <h3 className="text-sm font-medium text-gray-400 mb-2">爱好</h3>
                       <p className="text-gray-800 whitespace-pre-wrap">{selectedCustomer?.hobbies || '未录入'}</p>
                   </div>

                   <div className="bg-white rounded-xl overflow-hidden shadow-sm p-4 mb-8">
                       <h3 className="text-sm font-medium text-gray-400 mb-2">备注</h3>
                       <p className="text-gray-800 whitespace-pre-wrap">{selectedCustomer?.notes || '无'}</p>
                   </div>
               </div>
            </div>
          ) : view === 'IMPORT_EXPORT' ? (
              // Import Export View
              <ImportExportView 
                company={activeCompany} 
                customers={companyCustomers} 
                departments={companyDepartments}
                onImportComplete={handleImportComplete}
              />
          ) : view === 'CHART' ? (
              // Org Chart View
              <OrgChart 
                companyName={activeCompany.name}
                customers={companyCustomers} 
                departments={companyDepartments} 
                onSelectCustomer={setSelectedCustomerId} 
              />
          ) : (
              // List View
              <div className="h-full flex flex-col">
                  {/* Search Bar */}
                  <div className="px-4 py-2 bg-gray-100/50">
                      <div className="bg-gray-200 rounded-xl px-3 py-2 flex items-center gap-2">
                          <IconSearch className="text-gray-500 w-5 h-5" />
                          <input 
                            className="bg-transparent outline-none flex-1 text-gray-900 placeholder-gray-500"
                            placeholder="搜索姓名、部门、职务"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                          />
                      </div>
                  </div>

                  {/* Tabs/List */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredCustomers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-gray-400 mt-20">
                            <IconBriefcase className="w-12 h-12 mb-4 opacity-50" />
                            <p>暂无客户数据</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200 bg-white">
                            {filteredCustomers.map(c => (
                                <SwipeableCustomerCard
                                    key={c.id}
                                    customer={c}
                                    departmentName={companyDepartments.find(d => d.id === c.departmentId)?.name}
                                    isSelected={selectedCustomerId === c.id}
                                    onClick={() => setSelectedCustomerId(c.id)}
                                    onDelete={(customer) => {
                                        setCustomerToDelete(customer);
                                        setShowCustomerDeleteDialog(true);
                                    }}
                                />
                            ))}
                        </div>
                    )}
                  </div>
              </div>
          )}
      </div>

      {/* Editor Modal */}
      {editingCustomer !== null && (
          <CustomerForm 
            companyId={activeCompany.id}
            initialData={editingCustomer || undefined}
            allCustomers={companyCustomers}
            allDepartments={companyDepartments}
            onSave={handleSaveCustomer}
            onCancel={() => setEditingCustomer(null)}
          />
      )}

      {/* 客户删除确认对话框 */}
      {showCustomerDeleteDialog && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-4 text-gray-900">确认删除</h3>
            <p className="text-gray-600 mb-6">
              是否确认删除该客户信息？
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCustomerDeleteDialog(false);
                  setCustomerToDelete(null);
                }}
                className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-medium"
              >
                取消
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

const DetailRow = ({ label, value, copyable }: { label: string, value?: string, copyable?: boolean }) => {
    if (!value) return null;
    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 active:bg-gray-50"
             onClick={() => {
                 if (copyable && value) {
                     navigator.clipboard.writeText(value);
                     // Could add toast here
                 }
             }}
        >
            <span className="text-gray-500 text-sm w-20 shrink-0">{label}</span>
            <span className={`text-gray-900 text-right truncate ${copyable ? 'text-ios-blue' : ''}`}>{value}</span>
        </div>
    );
}

export default App;