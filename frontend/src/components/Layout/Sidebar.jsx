import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  ClipboardList, 
  DollarSign, 
  BarChart3, 
  Settings,
  ScanLine,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

const Sidebar = ({ isMobileOpen, onMobileClose }) => {
  const location = useLocation();
  const { user, isAdmin, isTrainer } = useAuth();

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/members', icon: Users, label: 'Members' },
    { to: '/plans', icon: ClipboardList, label: 'Plans' },
    { to: '/attendance', icon: ScanLine, label: 'Attendance' },
    { to: '/payments', icon: DollarSign, label: 'Payments' },
    { to: '/balance', icon: DollarSign, label: 'Balance' },
    { to: '/reports', icon: BarChart3, label: 'Reports' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  const trainerLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/members', icon: Users, label: 'Members' },
    { to: '/attendance', icon: ScanLine, label: 'Attendance' },
  ];

  const memberLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/my-card', icon: CreditCard, label: 'My Card' },
    { to: '/plans', icon: ClipboardList, label: 'Plans' },
    { to: '/my-payments', icon: DollarSign, label: 'Payments' },
  ];

  let links = [];
  if (isAdmin) links = adminLinks;
  else if (isTrainer) links = trainerLinks;
  else links = memberLinks;

  const SidebarContent = ({ onLinkClick }) => (
    <div className="p-4 space-y-2">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = location.pathname === link.to;
        
        return (
          <Link
            key={link.to}
            to={link.to}
            onClick={onLinkClick}
            className={cn(
              "flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200",
              isActive
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/50"
                : "text-gray-400 hover:bg-gray-900 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="font-medium">{link.label}</span>
          </Link>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 bg-black border-r border-gray-800 min-h-screen">
        <SidebarContent onLinkClick={() => {}} />
      </aside>

      {/* Mobile Sidebar - Controlled by parent */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80" onClick={onMobileClose}>
          <div 
            className="fixed inset-y-0 left-0 w-64 bg-black border-r border-gray-800 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <h2 className="text-white font-semibold">Menu</h2>
              <button 
                onClick={onMobileClose}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <SidebarContent onLinkClick={onMobileClose} />
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
