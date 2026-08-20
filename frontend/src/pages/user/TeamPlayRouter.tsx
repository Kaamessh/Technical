import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../context/AuthContext';
import { Loader2 } from 'lucide-react';

export const TeamPlayRouter: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const resumeActiveRound = async () => {
      try {
        const res = await apiClient.get('/gameplay/team-status');
        if (!isMounted) return;

        if (res.data.route) {
          navigate(res.data.route, { replace: true });
        } else if (res.data.slot_id) {
          navigate('/team/round-1', { replace: true });
        } else {
          navigate('/team/join-slot', { replace: true });
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Failed to fetch team round status:', err);
        if (user?.slot_id) {
          navigate('/team/round-1', { replace: true });
        } else {
          navigate('/team/join-slot', { replace: true });
        }
      }
    };

    resumeActiveRound();

    return () => {
      isMounted = false;
    };
  }, [user?.slot_id, navigate]);

  if (error) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
        <p className="text-rose-500 font-bold mb-3">{error}</p>
        <button
          onClick={() => navigate('/team/round-1')}
          className="btn-primary text-xs py-2 px-4"
        >
          Go to Arena
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
        Resuming Your Active Challenge...
      </span>
    </div>
  );
};
