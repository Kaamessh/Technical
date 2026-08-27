import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { Plus, Play, Layers, Calendar, Trophy, Settings, HelpCircle, CheckCircle2, AlertCircle, FolderCheck } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      const res = await apiClient.get('/events');
      setEvents(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/events', { name, description });
      setName('');
      setDescription('');
      setShowCreateModal(false);
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/events/${id}`, { status: newStatus });
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update event status');
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this event? This will also delete all associated slots and teams.')) return;
    try {
      await apiClient.delete(`/events/${id}`);
      fetchEvents();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete event');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Event Operations Control</h1>
          <p className="text-sm text-slate-500 mt-1">Manage events, launch competitive slots, and author multi-round content.</p>
        </div>

        <button onClick={() => setShowCreateModal(true)} className="btn-primary gap-2">
          <Plus className="w-4 h-4" /> Create New Event
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-400">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="card text-center py-12">
          <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No Events Configured</h3>
          <p className="text-xs text-slate-500 mb-4">Get started by creating your first competitive event.</p>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary text-xs mx-auto">
            Create Event
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((evt) => (
            <div key={evt.id} className="card relative flex flex-col justify-between hover:border-indigo-200">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                      evt.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : evt.status === 'completed'
                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}
                  >
                    {evt.status}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(evt.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between items-start">
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{evt.name}</h3>
                  <button onClick={() => handleDeleteEvent(evt.id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1 bg-rose-50 rounded">Delete</button>
                </div>
                <p className="text-xs text-slate-500 mb-6 line-clamp-2">{evt.description || 'No description provided.'}</p>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <div className="grid grid-cols-3 gap-2">
                  <Link
                    to={`/admin/slots?eventId=${evt.id}`}
                    className="btn-secondary text-xs py-2 px-2 justify-center gap-1 font-bold"
                  >
                    <Play className="w-3.5 h-3.5 text-indigo-600" /> Slots
                  </Link>

                  <Link
                    to={`/admin/question-bank?eventId=${evt.id}`}
                    className="btn-secondary text-xs py-2 px-2 justify-center gap-1 font-bold"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-600" /> Content
                  </Link>

                  <Link
                    to={`/admin/problem-allocations?eventId=${evt.id}`}
                    className="btn-secondary text-xs py-2 px-2 justify-center gap-1 font-bold text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100"
                  >
                    <FolderCheck className="w-3.5 h-3.5 text-indigo-600" /> Allocations
                  </Link>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] font-semibold text-slate-400">Status Toggle:</span>
                  <select
                    value={evt.status}
                    onChange={(e) => handleUpdateStatus(evt.id, e.target.value)}
                    className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Create Event */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="card max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-extrabold text-slate-900 mb-4">Create New Event</h3>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grand Cyber Championship 2026"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter details about the event rounds and schedule..."
                  className="input-field text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button type="submit" disabled={isSubmitting} className="btn-primary text-xs disabled:opacity-50">
                  {isSubmitting ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
