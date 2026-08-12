import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface BackButtonProps {
  to?: string;
  label?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ to, label = 'Back', className = '' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Team members are not permitted to go back to previous rounds or questions
  if (user?.role === 'team') {
    return null;
  }

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      type="button"
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 hover:text-slate-900 border border-slate-200 rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer ${className}`}
    >
      <ArrowLeft className="w-4 h-4 text-indigo-600" />
      <span>{label}</span>
    </button>
  );
};
