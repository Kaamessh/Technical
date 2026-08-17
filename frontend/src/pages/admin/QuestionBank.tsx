import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { resolveImageUrl } from '../../lib/imageUtils';
import { Plus, Trash2, HelpCircle, Image, Sparkles, Database, KeyRound, CheckCircle } from 'lucide-react';

export const QuestionBank: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [activeTab, setActiveTab] = useState<number>(1);

  // Round 1 States
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [r1Question, setR1Question] = useState('');
  const [r1Options, setR1Options] = useState(['', '', '', '']);
  const [r1CorrectIndex, setR1CorrectIndex] = useState(0);

  // Round 2 States (Text + Emoji Workflow & Distractors)
  const [workflowChallenges, setWorkflowChallenges] = useState<any[]>([]);
  const [r2Title, setR2Title] = useState('Find the data life cycle workflow');
  const [r2RealSteps, setR2RealSteps] = useState([
    '📸 Capture',
    '💾 Store',
    '⚙️ Process',
    '📊 Use',
    '📦 Archive',
    '🗑️ Destroy',
  ]);
  const [r2Distractors, setR2Distractors] = useState([
    '🖨️ Printing on paper',
    '🎤 Singing a song',
    '🎨 Painting a wall',
  ]);

  // Round 3 States
  const [aiChallenges, setAiChallenges] = useState<any[]>([]);
  const [r3ImageA, setR3ImageA] = useState('');
  const [r3ImageB, setR3ImageB] = useState('');
  const [r3CorrectSide, setR3CorrectSide] = useState<'A' | 'B'>('A');

  // Round 4 States
  const [dataQuestions, setDataQuestions] = useState<any[]>([]);
  const [r4Question, setR4Question] = useState('');
  const [r4Options, setR4Options] = useState(['', '', '', '']);
  const [r4CorrectIndex, setR4CorrectIndex] = useState(0);

  // Round 5 States
  const [decodePool, setDecodePool] = useState<any[]>([]);
  const [r5BinaryClue, setR5BinaryClue] = useState('');
  const [r5TargetWord, setR5TargetWord] = useState('');

  useEffect(() => {
    apiClient.get('/events').then((res) => {
      setEvents(res.data);
      if (!selectedEventId && res.data.length > 0) {
        setSelectedEventId(res.data[0].id);
      }
    });
  }, []);

  const loadContent = async () => {
    if (!selectedEventId) return;
    if (activeTab === 1) {
      const res = await apiClient.get(`/questions/round1/event/${selectedEventId}`);
      setQuizQuestions(res.data);
    } else if (activeTab === 2) {
      const res = await apiClient.get(`/workflow-challenges/event/${selectedEventId}`);
      setWorkflowChallenges(res.data);
    } else if (activeTab === 3) {
      const res = await apiClient.get(`/ai-or-real/event/${selectedEventId}`);
      setAiChallenges(res.data);
    } else if (activeTab === 4) {
      const res = await apiClient.get(`/data-challenge/event/${selectedEventId}`);
      setDataQuestions(res.data);
    } else if (activeTab === 5) {
      const res = await apiClient.get(`/decode-words/pool/${selectedEventId}`);
      setDecodePool(res.data);
    }
  };

  useEffect(() => {
    loadContent();
  }, [selectedEventId, activeTab]);

  // Round 1 Handlers
  const handleAddR1 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/questions/round1', {
        event_id: selectedEventId,
        question_text: r1Question,
        options: r1Options,
        correct_index: r1CorrectIndex,
      });
      setR1Question('');
      setR1Options(['', '', '', '']);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add question');
    }
  };

  const handleDeleteR1 = async (id: string) => {
    await apiClient.delete(`/questions/round1/${id}`);
    loadContent();
  };

  // Round 2 Handlers
  const handleAddR2 = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanReal = r2RealSteps.filter((s) => s.trim().length > 0);
    const cleanDist = r2Distractors.filter((s) => s.trim().length > 0);

    if (cleanReal.length === 0) {
      alert('Please add at least 1 real workflow step in the correct order.');
      return;
    }

    const payloadSteps = [...cleanReal, '__DISTRACTOR__', ...cleanDist];

    try {
      await apiClient.post('/workflow-challenges', {
        event_id: selectedEventId,
        title: r2Title,
        image_urls: payloadSteps,
      });
      setR2Title('Find the data life cycle workflow');
      setR2RealSteps(['📸 Capture', '💾 Store', '⚙️ Process', '📊 Use', '📦 Archive', '🗑️ Destroy']);
      setR2Distractors(['🖨️ Printing on paper', '🎤 Singing a song', '🎨 Painting a wall']);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add workflow challenge');
    }
  };

  // Round 3 Handlers
  const handleAddR3 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/ai-or-real', {
        event_id: selectedEventId,
        image_a_url: r3ImageA,
        image_b_url: r3ImageB,
        correct_side: r3CorrectSide,
      });
      setR3ImageA('');
      setR3ImageB('');
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add AI or Real challenge');
    }
  };

  // Round 4 Handlers
  const handleAddR4 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/data-challenge', {
        event_id: selectedEventId,
        question_text: r4Question,
        options: r4Options,
        correct_index: r4CorrectIndex,
      });
      setR4Question('');
      setR4Options(['', '', '', '']);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add data challenge');
    }
  };

  // Round 5 Handlers
  const handleAddR5 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/decode-words/pool', {
        event_id: selectedEventId,
        binary_clue: r5BinaryClue,
        target_word: r5TargetWord,
      });
      setR5BinaryClue('');
      setR5TargetWord('');
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to add pool word');
    }
  };

  const handleDeleteR2 = async (id: string) => {
    if (!confirm('Delete this workflow challenge from database?')) return;
    try {
      await apiClient.delete(`/workflow-challenges/${id}`);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete workflow challenge');
    }
  };

  const handleDeleteR3 = async (id: string) => {
    if (!confirm('Delete this AI challenge from database?')) return;
    try {
      await apiClient.delete(`/ai-or-real/${id}`);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete challenge');
    }
  };

  const handleDeleteR4 = async (id: string) => {
    if (!confirm('Delete this data challenge question from database?')) return;
    try {
      await apiClient.delete(`/data-challenge/${id}`);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete question');
    }
  };

  const handleDeleteR5 = async (wordId: string) => {
    if (!confirm('Delete this decode word from database?')) return;
    try {
      await apiClient.delete(`/decode-words/pool/${selectedEventId}/${wordId}`);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete word');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Challenge Content Authoring</h1>
          <p className="text-sm text-slate-500 mt-1">Configure questions, image sequences, AI pairs, and target decode words across all 5 rounds.</p>
        </div>

        {events.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Event:</span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="input-field text-sm font-semibold py-2 w-64 bg-white"
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {evt.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 mb-8 overflow-x-auto">
        {[
          { id: 1, label: 'Round 1: Live Quiz', icon: HelpCircle },
          { id: 2, label: 'Round 2: Workflow', icon: Image },
          { id: 3, label: 'Round 3: AI or Real', icon: Sparkles },
          { id: 4, label: 'Round 4: Spot Data', icon: Database },
          { id: 5, label: 'Round 5: Decode Words', icon: KeyRound },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ROUND 1 QUIZ */}
      {activeTab === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card h-fit">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Add Quiz Question</h3>
            <form onSubmit={handleAddR1} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Question Text
                </label>
                <textarea
                  rows={2}
                  required
                  value={r1Question}
                  onChange={(e) => setR1Question(e.target.value)}
                  placeholder="Enter question prompt..."
                  className="input-field text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Options & Correct Answer
                </label>
                {r1Options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="r1Correct"
                      checked={r1CorrectIndex === idx}
                      onChange={() => setR1CorrectIndex(idx)}
                      className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const copy = [...r1Options];
                        copy[idx] = e.target.value;
                        setR1Options(copy);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="input-field text-xs py-2"
                    />
                  </div>
                ))}
              </div>

              <button type="submit" className="btn-primary w-full text-xs py-2.5 font-bold">
                Save Quiz Question
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Quiz Question Bank ({quizQuestions.length})</h3>
            {quizQuestions.length === 0 ? (
              <div className="card text-center py-8 text-slate-400">No questions added yet.</div>
            ) : (
              quizQuestions.map((q, i) => (
                <div key={q.id} className="card relative p-4 flex items-start justify-between border-slate-200">
                  <div>
                    <div className="text-xs font-mono font-bold text-indigo-600 mb-1">Question #{i + 1}</div>
                    <div className="font-bold text-slate-900 text-sm mb-2">{q.question_text}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                      {(q.options as string[]).map((opt, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded border ${
                            idx === q.correct_index
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-100'
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}. {opt}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteR1(q.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: WORKFLOW */}
      {activeTab === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card h-fit">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Add Workflow Sequence Puzzle</h3>
            <form onSubmit={handleAddR2} className="space-y-5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Question / Challenge Title
                </label>
                <input
                  type="text"
                  required
                  value={r2Title}
                  onChange={(e) => setR2Title(e.target.value)}
                  placeholder="e.g. Find the data life cycle workflow"
                  className="input-field text-sm"
                />
              </div>

              {/* REAL STEPS (IN EXACT ORDER) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                    Real Flow Steps ({r2RealSteps.length} Steps in Order)
                  </label>
                  <button
                    type="button"
                    onClick={() => setR2RealSteps([...r2RealSteps, ''])}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                  >
                    <Plus className="w-3 h-3" /> Add Step
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Enter the real steps with emojis in the exact flow order members must arrange.
                </p>

                {r2RealSteps.map((step, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400 w-12 text-right">#{idx + 1}</span>
                    <input
                      type="text"
                      required
                      value={step}
                      onChange={(e) => {
                        const copy = [...r2RealSteps];
                        copy[idx] = e.target.value;
                        setR2RealSteps(copy);
                      }}
                      placeholder={`e.g. 📸 Step ${idx + 1}`}
                      className="input-field text-xs py-2 flex-1 border-emerald-200 bg-emerald-50/20 font-semibold"
                    />
                    {r2RealSteps.length > 2 && (
                      <button
                        type="button"
                        onClick={() => setR2RealSteps(r2RealSteps.filter((_, i) => i !== idx))}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                        title="Remove step"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* IRRELEVANT / DISTRACTOR STEPS */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-rose-700">
                    Irrelevant / Distractor Steps ({r2Distractors.length} Extras)
                  </label>
                  <button
                    type="button"
                    onClick={() => setR2Distractors([...r2Distractors, ''])}
                    className="text-[11px] font-bold text-rose-700 hover:text-rose-800 flex items-center gap-1 bg-rose-50 px-2 py-0.5 rounded border border-rose-200"
                  >
                    <Plus className="w-3 h-3" /> Add Distractor
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">
                  Extra wrong steps with emojis that will be scattered to distract members.
                </p>

                {r2Distractors.map((dis, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-rose-400 w-12 text-right">Ext</span>
                    <input
                      type="text"
                      value={dis}
                      onChange={(e) => {
                        const copy = [...r2Distractors];
                        copy[idx] = e.target.value;
                        setR2Distractors(copy);
                      }}
                      placeholder={`e.g. 🎨 Wrong step ${idx + 1}`}
                      className="input-field text-xs py-2 flex-1 border-rose-200 bg-rose-50/20 font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setR2Distractors(r2Distractors.filter((_, i) => i !== idx))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                      title="Remove distractor"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn-primary w-full text-xs py-3 font-extrabold">
                Save Workflow ({r2RealSteps.length} Real + {r2Distractors.length} Distractors = {r2RealSteps.length + r2Distractors.length} Total Cards)
              </button>
            </form>
          </div>

          {/* WORKFLOW CHALLENGES LISTING */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Configured Workflows ({workflowChallenges.length})</h3>
            {workflowChallenges.map((wf) => {
              const rawUrls = (wf.image_urls as string[]) || [];
              const distIdx = rawUrls.indexOf('__DISTRACTOR__');
              const realList = distIdx !== -1 ? rawUrls.slice(0, distIdx) : rawUrls;
              const distList = distIdx !== -1 ? rawUrls.slice(distIdx + 1) : [];

              return (
                <div key={wf.id} className="card p-5 border-slate-200 flex items-start justify-between gap-4 shadow-sm">
                  <div className="flex-1 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Question / Puzzle Prompt
                      </span>
                      <h4 className="font-extrabold text-base text-slate-900 mt-1">{wf.title}</h4>
                    </div>

                    {/* Real Flow Steps */}
                    <div>
                      <span className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-wider block mb-1.5">
                        ✔ Real Flow Order ({realList.length} Steps):
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {realList.map((step, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 border border-emerald-200 shadow-2xs">
                            <span className="text-[10px] text-emerald-600 font-mono">#{idx + 1}</span> {step}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Distractor Steps */}
                    {distList.length > 0 && (
                      <div>
                        <span className="text-[11px] font-extrabold text-rose-700 uppercase tracking-wider block mb-1.5">
                          ❌ Distractor Steps ({distList.length} Extras):
                        </span>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {distList.map((dis, idx) => (
                            <span key={idx} className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-rose-50 text-rose-900 border border-rose-200 shadow-2xs">
                              {dis}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteR2(wf.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete workflow challenge from DB"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: AI OR REAL */}
      {activeTab === 3 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card h-fit">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Add AI vs Real Image Pair</h3>
            <form onSubmit={handleAddR3} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Image A URL / Local Path / Upload File
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    value={r3ImageA}
                    onChange={(e) => setR3ImageA(e.target.value)}
                    placeholder="e.g. Images/1a.webp or http://..."
                    className="input-field text-xs py-2"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setR3ImageA(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Image B URL / Local Path / Upload File
                </label>
                <div className="space-y-1.5">
                  <input
                    type="text"
                    required
                    value={r3ImageB}
                    onChange={(e) => setR3ImageB(e.target.value)}
                    placeholder="e.g. Images/1b.webp or http://..."
                    className="input-field text-xs py-2"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setR3ImageB(ev.target.result as string);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Which Side is AI-Generated?
                </label>
                <select
                  value={r3CorrectSide}
                  onChange={(e) => setR3CorrectSide(e.target.value as 'A' | 'B')}
                  className="input-field text-sm"
                >
                  <option value="A">Image A is AI</option>
                  <option value="B">Image B is AI</option>
                </select>
              </div>

              <button type="submit" className="btn-primary w-full text-xs py-2.5 font-bold">
                Save Challenge Pair
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">AI vs Real Challenges ({aiChallenges.length})</h3>
            {aiChallenges.map((ch) => (
              <div key={ch.id} className="card p-4 border-slate-200 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`relative rounded overflow-hidden border-2 ${ch.correct_side === 'A' ? 'border-amber-500' : 'border-slate-200'}`}>
                      <img src={resolveImageUrl(ch.image_a_url)} alt="Image A" className="w-full h-40 object-cover" />
                      <span className="absolute top-2 left-2 bg-slate-900 text-white font-bold text-xs px-2 py-0.5 rounded">
                        Option A {ch.correct_side === 'A' && '(AI)'}
                      </span>
                    </div>
                    <div className={`relative rounded overflow-hidden border-2 ${ch.correct_side === 'B' ? 'border-amber-500' : 'border-slate-200'}`}>
                      <img src={resolveImageUrl(ch.image_b_url)} alt="Image B" className="w-full h-40 object-cover" />
                      <span className="absolute top-2 left-2 bg-slate-900 text-white font-bold text-xs px-2 py-0.5 rounded">
                        Option B {ch.correct_side === 'B' && '(AI)'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteR3(ch.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete AI challenge from DB"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SPOT THE DATA */}
      {activeTab === 4 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card h-fit">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Add Data Challenge Question</h3>
            <form onSubmit={handleAddR4} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Question Text
                </label>
                <textarea
                  rows={2}
                  required
                  value={r4Question}
                  onChange={(e) => setR4Question(e.target.value)}
                  placeholder="Enter data anomaly question..."
                  className="input-field text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Options & Correct Answer
                </label>
                {r4Options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="r4Correct"
                      checked={r4CorrectIndex === idx}
                      onChange={() => setR4CorrectIndex(idx)}
                      className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => {
                        const copy = [...r4Options];
                        copy[idx] = e.target.value;
                        setR4Options(copy);
                      }}
                      placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      className="input-field text-xs py-2"
                    />
                  </div>
                ))}
              </div>

              <button type="submit" className="btn-primary w-full text-xs py-2.5 font-bold">
                Save Data Question
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Data Questions ({dataQuestions.length})</h3>
            {dataQuestions.map((q, i) => (
              <div key={q.id} className="card p-4 border-slate-200 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="font-bold text-slate-900 text-sm mb-2">{q.question_text}</div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-medium">
                    {(q.options as string[]).map((opt, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded border ${
                          idx === q.correct_index
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                            : 'bg-slate-50 text-slate-700 border-slate-100'
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}. {opt}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteR4(q.id)}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                  title="Delete data question from DB"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: DECODE WORDS */}
      {activeTab === 5 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card h-fit">
            <h3 className="text-base font-extrabold text-slate-900 mb-4">Add to Target Word Pool</h3>
            <form onSubmit={handleAddR5} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Binary Clue
                </label>
                <input
                  type="text"
                  required
                  value={r5BinaryClue}
                  onChange={(e) => setR5BinaryClue(e.target.value)}
                  placeholder="e.g. 1111 1111"
                  className="input-field text-sm font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">Separate 4-bit nibbles with a space. E.g. "1111 1111" = 1515</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Word
                </label>
                <input
                  type="text"
                  required
                  value={r5TargetWord}
                  onChange={(e) => setR5TargetWord(e.target.value.toUpperCase())}
                  placeholder="e.g. HOSPITAL"
                  className="input-field text-sm font-mono uppercase"
                />
              </div>

              <button type="submit" className="btn-primary w-full text-xs py-2.5 font-bold">
                Save to Pool
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Decode Word Pool ({decodePool.length})</h3>
            <p className="text-xs text-slate-500 mb-4">
              Words from this pool will be automatically assigned to teams when they join a slot. 
              The system auto-calculates the letter sequence and final password.
            </p>
            
            <div className="overflow-x-auto card p-0 border-slate-200">
              <table className="w-full text-left text-xs font-medium border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 uppercase text-slate-500 font-bold">
                    <th className="py-3 px-4">Binary Clue</th>
                    <th className="py-3 px-4">Target Word</th>
                    <th className="py-3 px-4">Letter Numbers (8)</th>
                    <th className="py-3 px-4">Expected Password</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {decodePool.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-sans">
                        No words in the pool yet. Add some on the left.
                      </td>
                    </tr>
                  ) : (
                    decodePool.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-amber-600 font-bold">{item.binary_clue}</td>
                        <td className="py-3 px-4 text-indigo-600 font-bold">{item.target_word}</td>
                        <td className="py-3 px-4 text-emerald-600 font-bold">
                          [{item.letter_numbers.join(', ')}]
                        </td>
                        <td className="py-3 px-4 text-slate-800 font-extrabold">
                          {item.final_password}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleDeleteR5(item.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
