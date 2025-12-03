import React from 'react';
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
  ScanLine
} from 'lucide-react';
import { cn } from '../../lib/utils';

const Sidebar = () => {
  const location = useLocation();
  const { user, isAdmin, isTrainer } = useAuth();

  const adminLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/members', icon: Users, label: 'Members' },
    { to: '/plans', icon: ClipboardList, label: 'Plans' },
    { to: '/attendance', icon: ScanLine, label: 'Attendance' },
    { to: '/payments', icon: DollarSign, label: 'Payments' },
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

  return (
    <aside className="w-64 bg-black border-r border-gray-800 min-h-screen">
      <div className="p-4 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname === link.to;
          
          return (
            <Link
              key={link.to}
              to={link.to}
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
    </aside>
  );
};

export default Sidebar;
