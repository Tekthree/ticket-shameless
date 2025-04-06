'use client';

import React, { createContext, useContext, useState } from 'react';

type TabsContextValue = {
  activeTab: string;
  setActiveTab: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a TabsProvider');
  }
  return context;
}

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ defaultValue, className = '', children }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

interface TabsListProps {
  className?: string;
  children: React.ReactNode;
}

export function TabsList({ className = '', children }: TabsListProps) {
  return (
    <div className={`flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-md ${className}`}>
      {children}
    </div>
  );
}

interface TabsTriggerProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsTrigger({ value, className = '', children }: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabs();
  const isActive = activeTab === value;
  
  return (
    <button
      type="button"
      className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-all
        ${isActive 
          ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        } ${className}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

interface TabsContentProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

export function TabsContent({ value, className = '', children }: TabsContentProps) {
  const { activeTab } = useTabs();
  
  if (activeTab !== value) {
    return null;
  }
  
  return (
    <div className={`mt-2 ${className}`}>
      {children}
    </div>
  );
}
