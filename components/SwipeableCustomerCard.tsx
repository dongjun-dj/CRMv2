import React, { useRef, useState, useEffect } from 'react';
import { Customer, Department } from '../types';
import { IconTrash } from './Icons';

interface SwipeableCustomerCardProps {
  customer: Customer;
  departmentName?: string;
  isSelected?: boolean;
  onClick?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
}

export const SwipeableCustomerCard: React.FC<SwipeableCustomerCardProps> = ({
  customer,
  departmentName,
  isSelected = false,
  onClick,
  onDelete
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const deleteButtonRef = useRef<HTMLButtonElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [showDeleteButton, setShowDeleteButton] = useState(false);

  // 删除按钮宽度
  const deleteButtonWidth = 100;
  // 触发删除按钮显示的最小滑动距离
  const threshold = 50;

  // 处理触摸开始
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setCurrentX(touch.clientX);
    setIsDragging(true);
  };

  // 处理触摸移动
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const touch = e.touches[0];
    const diffX = startX - touch.clientX;
    
    // 限制滑动范围
    if (diffX > 0) {
      // 向左滑动
      const limitedX = Math.min(diffX, deleteButtonWidth);
      setTranslateX(-limitedX);
      setCurrentX(touch.clientX);
    } else if (diffX < 0) {
      // 向右滑动
      const limitedX = Math.max(diffX, -deleteButtonWidth);
      setTranslateX(-limitedX);
      setCurrentX(touch.clientX);
    }
  };

  // 处理触摸结束
  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const diffX = startX - currentX;
    
    // 根据滑动距离决定是否显示删除按钮
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // 向左滑动超过阈值，显示删除按钮
        setTranslateX(-deleteButtonWidth);
        setShowDeleteButton(true);
      } else {
        // 向右滑动，隐藏删除按钮
        setTranslateX(0);
        setShowDeleteButton(false);
      }
    } else {
      // 滑动未超过阈值，恢复原位
      setTranslateX(0);
      setShowDeleteButton(false);
    }
    
    setIsDragging(false);
  };

  // 处理鼠标按下（桌面端支持）
  const handleMouseDown = (e: React.MouseEvent) => {
    // 如果是右键点击，不处理
    if (e.button !== 0) return;
    
    // 记录初始位置和时间，用于判断是否是拖拽操作
    const mouseDownTime = Date.now();
    setStartX(e.clientX);
    setCurrentX(e.clientX);
    
    // 添加全局鼠标事件监听
    const handleMouseMoveGlobal = (e: MouseEvent) => {
      const diffX = startX - e.clientX;
      
      // 只有当移动距离超过阈值时才开始拖拽
      if (Math.abs(diffX) > 5) {
        setIsDragging(true);
        
        // 限制滑动范围
        if (diffX > 0) {
          // 向左滑动
          const limitedX = Math.min(diffX, deleteButtonWidth);
          setTranslateX(-limitedX);
        } else if (diffX < 0) {
          // 向右滑动
          const limitedX = Math.max(diffX, -deleteButtonWidth);
          setTranslateX(-limitedX);
        }
      }
      
      setCurrentX(e.clientX);
    };
    
    const handleMouseUpGlobal = () => {
      // 移除全局鼠标事件监听
      document.removeEventListener('mousemove', handleMouseMoveGlobal);
      document.removeEventListener('mouseup', handleMouseUpGlobal);
      
      // 如果是拖拽操作，处理拖拽结束
      if (isDragging) {
        const diffX = startX - currentX;
        
        // 根据滑动距离决定是否显示删除按钮
        if (Math.abs(diffX) > threshold) {
          if (diffX > 0) {
            // 向左滑动超过阈值，显示删除按钮
            setTranslateX(-deleteButtonWidth);
            setShowDeleteButton(true);
          } else {
            // 向右滑动，隐藏删除按钮
            setTranslateX(0);
            setShowDeleteButton(false);
          }
        } else {
          // 滑动未超过阈值，恢复原位
          setTranslateX(0);
          setShowDeleteButton(false);
        }
        
        setIsDragging(false);
      }
    };
    
    document.addEventListener('mousemove', handleMouseMoveGlobal);
    document.addEventListener('mouseup', handleMouseUpGlobal);
  };

  // 处理鼠标移动
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const diffX = startX - e.clientX;
    
    // 限制滑动范围
    if (diffX > 0) {
      // 向左滑动
      const limitedX = Math.min(diffX, deleteButtonWidth);
      setTranslateX(-limitedX);
      setCurrentX(e.clientX);
    } else if (diffX < 0) {
      // 向右滑动
      const limitedX = Math.max(diffX, -deleteButtonWidth);
      setTranslateX(-limitedX);
      setCurrentX(e.clientX);
    }
  };

  // 处理鼠标释放
  const handleMouseUp = () => {
    if (!isDragging) return;
    
    // 移除全局鼠标事件监听
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    const diffX = startX - currentX;
    
    // 根据滑动距离决定是否显示删除按钮
    if (Math.abs(diffX) > threshold) {
      if (diffX > 0) {
        // 向左滑动超过阈值，显示删除按钮
        setTranslateX(-deleteButtonWidth);
        setShowDeleteButton(true);
      } else {
        // 向右滑动，隐藏删除按钮
        setTranslateX(0);
        setShowDeleteButton(false);
      }
    } else {
      // 滑动未超过阈值，恢复原位
      setTranslateX(0);
      setShowDeleteButton(false);
    }
    
    setIsDragging(false);
  };

  // 处理点击卡片
  const handleCardClick = (e: React.MouseEvent) => {
    // 如果正在滑动或删除按钮已显示，不触发点击事件
    if (isDragging || showDeleteButton) return;
    
    // 阻止事件冒泡
    e.stopPropagation();
    
    if (onClick) {
      onClick(customer);
    }
  };

  // 处理删除按钮点击
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(customer);
    }
  };

  // 重置状态当客户变化时
  useEffect(() => {
    setTranslateX(0);
    setShowDeleteButton(false);
    setIsDragging(false);
  }, [customer.id]);

  // 清理全局事件监听
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      {/* 删除按钮 */}
      <button
        ref={deleteButtonRef}
        className={`absolute right-0 top-0 bottom-0 bg-red-500 text-white px-4 flex items-center justify-center transition-opacity duration-200 ${
          showDeleteButton ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ width: `${deleteButtonWidth}px` }}
        onClick={handleDeleteClick}
      >
        <IconTrash className="w-5 h-5" />
        <span className="ml-2">删除</span>
      </button>
      
      {/* 客户卡片 */}
      <div
        ref={cardRef}
        className={`px-4 py-4 bg-white flex items-center justify-between cursor-pointer ${
          isSelected ? 'bg-blue-50' : ''
        } transition-transform duration-200 ${isDragging ? '' : 'active:bg-gray-50'}`}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          // 如果正在滑动或删除按钮已显示，不触发点击事件
          if (isDragging || showDeleteButton) return;
          
          // 阻止事件冒泡
          e.stopPropagation();
          
          if (onClick) {
            onClick(customer);
          }
        }}
        data-testid="customer-card"
        data-customer-id={customer.id}
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden font-bold text-gray-500 text-sm">
            {customer.photo ? (
              <img src={customer.photo} className="w-full h-full object-cover" alt="Avatar" />
            ) : (
              customer.name[0]
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">{customer.name}</div>
            <div className="text-sm text-gray-500">
              {departmentName}
              {customer.jobTitle && ` · ${customer.jobTitle}`}
            </div>
          </div>
        </div>
        <div
          className={`px-2 py-0.5 rounded text-xs font-medium ${
            customer.status === 2
              ? 'bg-green-100 text-green-700'
              : customer.status === -2
              ? 'bg-red-100 text-red-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {customer.status}
        </div>
      </div>
    </div>
  );
};