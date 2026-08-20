import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { resolveImageUrl } from '../../lib/imageUtils';
import {
  Plus,
  Trash2,
  HelpCircle,
  Image,
  Sparkles,
  Database,
  KeyRound,
  CheckCircle,
  Shuffle,
  Edit2,
  RotateCcw,
  CheckCircle2,
  Save,
  FolderGit2,
  X,
  FileText,
} from 'lucide-react';
import { ROUND_4_TEMPLATES, Round4Template } from '../../data/round4Templates';

export const QuestionBank: React.FC = () => {
  const [searchParams] = useSearchParams();
  const eventIdParam = searchParams.get('eventId');

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>(eventIdParam || '');
  const [activeTab, setActiveTab] = useState<number>(4); // Default to Round 4 tab

  // Round 1 States
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [editingR1Id, setEditingR1Id] = useState<string | null>(null);
  const [r1Question, setR1Question] = useState('');
  const [r1Options, setR1Options] = useState(['', '', '', '']);
  const [r1CorrectIndex, setR1CorrectIndex] = useState(0);

  // Round 2 States (Text + Emoji Workflow & Distractors)
  const [workflowChallenges, setWorkflowChallenges] = useState<any[]>([]);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
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

  // Round 4 States (Dynamic Interactive Table Creator)
  const [dataQuestions, setDataQuestions] = useState<any[]>([]);
  const [editingR4Id, setEditingR4Id] = useState<string | null>(null);
  const [r4TaskInstruction, setR4TaskInstruction] = useState('Task: Identify the anomalous row(s) and explain the anomaly type.');
  const [r4Headers, setR4Headers] = useState<string[]>([
    'Borrow ID', 'Student', 'Book', 'Category', 'Issue Date', 'Return Date'
  ]);
  const [r4Rows, setR4Rows] = useState<string[][]>([
    ['L001', 'Rahul', 'Python', 'Programming', 'Aug 01', 'Aug 07'],
    ['L002', 'Priya', 'DBMS', 'Programming', 'Aug 02', 'Aug 09'],
    ['L003', 'Arjun', 'AI', 'Programming', 'Aug 03', 'Aug 10'],
    ['L004', 'Meena', 'Networks', 'Programming', 'Aug 04', 'Aug 12'],
    ['L005', 'Kiran', 'Organic Chemistry', 'Literature', 'Aug 05', 'Aug 12'],
    ['L006', 'Divya', 'Python', 'Programming', 'Aug 06', 'Aug 13'],
    ['L007', 'Sanjay', 'DBMS', 'Programming', 'Aug 07', 'Aug 14'],
  ]);
  const [r4CorrectRowIndex, setR4CorrectRowIndex] = useState<number>(4);

  // Round 5 States
  const [decodePool, setDecodePool] = useState<any[]>([]);
  const [r5BinaryClue, setR5BinaryClue] = useState('');
  const [r5TargetWord, setR5TargetWord] = useState('');

  // Round 6 States (Problem Statement Management)
  const [problemStatements, setProblemStatements] = useState<any[]>([]);
  const [editingPsId, setEditingPsId] = useState<string | null>(null);
  const [psTitle, setPsTitle] = useState('');
  const [psCategory, setPsCategory] = useState('AI & Machine Learning');
  const [psDescription, setPsDescription] = useState('');

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
    } else if (activeTab === 6) {
      const res = await apiClient.get(`/problem-statements/event/${selectedEventId}`);
      setProblemStatements(res.data);
    }
  };

  useEffect(() => {
    loadContent();
  }, [selectedEventId, activeTab]);

  // Round 1 Handlers
  const handleAddOrUpdateR1 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!r1Question.trim()) {
      alert('Please enter a question prompt.');
      return;
    }
    try {
      if (editingR1Id) {
        await apiClient.put(`/questions/round1/${editingR1Id}`, {
          question_text: r1Question,
          options: r1Options,
          correct_index: r1CorrectIndex,
        });
        alert('Quiz question updated successfully!');
      } else {
        await apiClient.post('/questions/round1', {
          event_id: selectedEventId,
          question_text: r1Question,
          options: r1Options,
          correct_index: r1CorrectIndex,
        });
        alert('Quiz question added successfully!');
      }
      setEditingR1Id(null);
      setR1Question('');
      setR1Options(['', '', '', '']);
      setR1CorrectIndex(0);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save question');
    }
  };

  const handleEditR1 = (q: any) => {
    setEditingR1Id(q.id);
    setR1Question(q.question_text || '');
    if (Array.isArray(q.options) && q.options.length >= 4) {
      setR1Options([...q.options]);
    } else if (Array.isArray(q.options)) {
      const padded = [...q.options];
      while (padded.length < 4) padded.push('');
      setR1Options(padded);
    } else {
      setR1Options(['', '', '', '']);
    }
    setR1CorrectIndex(q.correct_index !== undefined ? q.correct_index : 0);
  };

  const handleCancelEditR1 = () => {
    setEditingR1Id(null);
    setR1Question('');
    setR1Options(['', '', '', '']);
    setR1CorrectIndex(0);
  };

  const handleDeleteR1 = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz question?')) return;
    try {
      await apiClient.delete(`/questions/round1/${id}`);
      if (editingR1Id === id) {
        handleCancelEditR1();
      }
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete question');
    }
  };

  // Round 2 Handlers
  const handleSaveOrUpdateR2 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const formattedReal = r2RealSteps.map((s) => s.trim()).filter(Boolean);
      const formattedDistractors = r2Distractors.map((s) => s.trim()).filter(Boolean);
      const combinedUrls = [...formattedReal, '__DISTRACTOR__', ...formattedDistractors];

      if (editingWorkflowId) {
        await apiClient.put(`/workflow-challenges/${editingWorkflowId}`, {
          title: r2Title,
          image_urls: combinedUrls,
        });
        alert('Workflow challenge updated successfully!');
      } else {
        await apiClient.post('/workflow-challenges', {
          event_id: selectedEventId,
          title: r2Title,
          image_urls: combinedUrls,
        });
        alert('Workflow challenge created successfully!');
      }
      setEditingWorkflowId(null);
      setR2Title('Find the data life cycle workflow');
      setR2RealSteps(['📸 Capture', '💾 Store', '⚙️ Process', '📊 Use', '📦 Archive', '🗑️ Destroy']);
      setR2Distractors(['🖨️ Printing on paper', '🎤 Singing a song', '🎨 Painting a wall']);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save workflow challenge');
    }
  };

  const handleEditR2 = (wf: any) => {
    setEditingWorkflowId(wf.id);
    setR2Title(wf.title || 'Workflow Sequence Challenge');
    const rawUrls: string[] = Array.isArray(wf.image_urls) ? wf.image_urls : [];
    const distractorIdx = rawUrls.findIndex((s) => s.includes('__DISTRACTOR__'));
    if (distractorIdx !== -1) {
      setR2RealSteps(rawUrls.slice(0, distractorIdx));
      setR2Distractors(rawUrls.slice(distractorIdx + 1));
    } else {
      setR2RealSteps(rawUrls);
      setR2Distractors(['❌ Distractor Option']);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditR2 = () => {
    setEditingWorkflowId(null);
    setR2Title('Find the data life cycle workflow');
    setR2RealSteps(['📸 Capture', '💾 Store', '⚙️ Process', '📊 Use', '📦 Archive', '🗑️ Destroy']);
    setR2Distractors(['🖨️ Printing on paper', '🎤 Singing a song', '🎨 Painting a wall']);
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
      alert(err.response?.data?.error || 'Failed to add AI challenge');
    }
  };

  // Round 4 Table Handlers
  const handleAddR4Column = () => {
    setR4Headers((prev) => [...prev, `Column ${prev.length + 1}`]);
    setR4Rows((prev) => prev.map((row) => [...row, '-']));
  };

  const handleRemoveR4Column = (colIdx: number) => {
    if (r4Headers.length <= 1) return;
    setR4Headers((prev) => prev.filter((_, i) => i !== colIdx));
    setR4Rows((prev) => prev.map((row) => row.filter((_, i) => i !== colIdx)));
  };

  const handleAddR4Row = () => {
    const newRow = r4Headers.map((_, i) => (i === 0 ? `ID00${r4Rows.length + 1}` : 'Sample Data'));
    setR4Rows((prev) => [...prev, newRow]);
  };

  const handleRemoveR4Row = (rowIdx: number) => {
    if (r4Rows.length <= 1) return;
    setR4Rows((prev) => prev.filter((_, i) => i !== rowIdx));
    if (r4CorrectRowIndex >= r4Rows.length - 1) {
      setR4CorrectRowIndex(Math.max(0, r4Rows.length - 2));
    }
  };

  const handleShuffleR4Rows = () => {
    if (r4Rows.length <= 1) return;
    const indexed = r4Rows.map((row, idx) => ({ row, isCorrect: idx === r4CorrectRowIndex }));
    const shuffled = [...indexed].sort(() => 0.5 - Math.random());
    const newRows = shuffled.map((item) => item.row);
    const newCorrectIdx = shuffled.findIndex((item) => item.isCorrect);
    setR4Rows(newRows);
    setR4CorrectRowIndex(newCorrectIdx);
  };

  const handleLoadTemplate = (tpl: Round4Template) => {
    setR4TaskInstruction(tpl.question_text);
    setR4Headers([...tpl.headers]);
    setR4Rows(tpl.rows.map((r) => [...r]));
    setR4CorrectRowIndex(tpl.correct_index);
    setEditingR4Id(null);
  };

  const handlePreFillAll13R4Questions = async () => {
    if (!selectedEventId) {
      alert('Please select an event first.');
      return;
    }
    if (!confirm(`Are you sure you want to add all 13 standard data anomaly questions to this event?`)) {
      return;
    }

    try {
      for (const tpl of ROUND_4_TEMPLATES) {
        await apiClient.post('/data-challenge', {
          event_id: selectedEventId,
          question_text: tpl.question_text,
          options: {
            headers: tpl.headers,
            rows: tpl.rows,
          },
          correct_index: tpl.correct_index,
        });
      }
      alert('All 13 Standard Data Anomaly questions added successfully!');
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save all 13 questions');
    }
  };

  const handleAddOrUpdateR4 = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        event_id: selectedEventId,
        question_text: r4TaskInstruction,
        options: {
          headers: r4Headers,
          rows: r4Rows,
        },
        correct_index: r4CorrectRowIndex,
      };

      if (editingR4Id) {
        await apiClient.put(`/data-challenge/${editingR4Id}`, payload);
        alert('Data table question updated successfully!');
      } else {
        await apiClient.post('/data-challenge', payload);
        alert('New Data table question added successfully!');
      }

      setEditingR4Id(null);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save data challenge question');
    }
  };

  const handleEditR4 = (q: any) => {
    setEditingR4Id(q.id);
    setR4TaskInstruction(q.question_text || '');
    if (q.options && typeof q.options === 'object' && !Array.isArray(q.options) && q.options.headers) {
      setR4Headers(q.options.headers);
      setR4Rows(q.options.rows || []);
    } else if (Array.isArray(q.options)) {
      setR4Headers(['Option Text']);
      setR4Rows(q.options.map((opt: string) => [opt]));
    }
    setR4CorrectRowIndex(q.correct_index !== undefined ? q.correct_index : 0);
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

  // Round 6 Handlers
  const handleSaveProblemStatement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!psTitle.trim() || !psDescription.trim()) {
      alert('Please provide both a title and description for the problem statement.');
      return;
    }

    try {
      if (editingPsId) {
        await apiClient.put(`/problem-statements/${editingPsId}`, {
          event_id: selectedEventId,
          title: psTitle,
          category: psCategory,
          description: psDescription,
        });
        alert('Problem statement updated successfully!');
      } else {
        await apiClient.post('/problem-statements', {
          event_id: selectedEventId,
          title: psTitle,
          category: psCategory,
          description: psDescription,
        });
        alert('Problem statement created successfully!');
      }

      setEditingPsId(null);
      setPsTitle('');
      setPsDescription('');
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to save problem statement');
    }
  };

  const handleEditProblemStatement = (ps: any) => {
    setEditingPsId(ps.id);
    setPsTitle(ps.title);
    setPsCategory(ps.category || 'General');
    setPsDescription(ps.description);
  };

  const handleCancelEditProblemStatement = () => {
    setEditingPsId(null);
    setPsTitle('');
    setPsDescription('');
  };

  const handleDeleteProblemStatement = async (id: string) => {
    if (!confirm('Are you sure you want to delete this problem statement?')) return;
    try {
      await apiClient.delete(`/problem-statements/${id}?eventId=${selectedEventId}`);
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete problem statement');
    }
  };

  const handleLoadSampleProblemStatements = async () => {
    const samples = [
      {
        title: 'Autonomous Multi-Modal Traffic Anomaly & Hazard Detection System',
        category: 'Computer Vision & IoT',
        description:
          'Design and implement a real-time edge AI pipeline that ingests camera feeds from urban intersections to automatically detect vehicular accidents, stalled vehicles, and pedestrian jaywalking hazards with sub-100ms inference latency.',
      },
      {
        title: 'Decentralized Zero-Knowledge Healthcare Record Interoperability Protocol',
        category: 'Blockchain & Privacy',
        description:
          'Construct a cryptographic patient consent and medical history exchange platform using zk-SNARKs that allows hospitals to query validated clinical histories without decrypting patient personally identifiable data (PII).',
      },
      {
        title: 'Intelligent Supply Chain Route Optimizer with Carbon Footprint Minimization',
        category: 'Logistics & Sustainability',
        description:
          'Develop a dynamic freight routing optimization engine leveraging graph reinforcement learning that balances delivery SLA deadlines against multi-modal vehicle fuel consumption to minimize aggregate carbon emissions.',
      },
      {
        title: 'Automated Financial Transaction Fraud & Ring Network Investigator',
        category: 'Cybersecurity & Fintech',
        description:
          'Build an interactive graph anomaly analysis dashboard capable of processing high-frequency UPI/credit transactions, surfacing synthetic identity fraud rings, circular fund loops, and sudden burst velocity patterns.',
      },
      {
        title: 'Generative AI-Powered Personalized Adaptive Education Tutor',
        category: 'EdTech & LLMs',
        description:
          'Create an AI pedagogical agent with retrieval-augmented generation (RAG) that continually evaluates learner cognitive mastery through quizzes, identifies core misconceptions, and dynamically scaffolds tailored learning paths.',
      },
      {
        title: 'Distributed Disaster Response Resource Allocation & Drone Dispatch Mesh',
        category: 'Emergency Management & Cloud',
        description:
          'Architect an offline-first mesh network and coordinator portal for first responders during natural disasters, orchestrating drone search patterns, shelter occupancy telemetry, and critical medical supply distribution.',
      },
    ];

    try {
      for (const sample of samples) {
        await apiClient.post('/problem-statements', {
          event_id: selectedEventId,
          ...sample,
        });
      }
      alert('6 Standard Hackathon Problem Statements added successfully!');
      loadContent();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to load samples');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Challenge Content Authoring</h1>
          <p className="text-sm text-slate-500 mt-1">Configure questions, image sequences, AI pairs, interactive data tables, and target decode words.</p>
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
          { id: 4, label: 'Round 4: Spot Data Anomaly', icon: Database },
          { id: 5, label: 'Round 5: Decode Words', icon: KeyRound },
          { id: 6, label: 'Round 6: Problem Statements', icon: FolderGit2 },
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
          <div className="card h-fit border-indigo-100 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                {editingR1Id ? 'Edit Quiz Question' : 'Add Quiz Question'}
              </h3>
              {editingR1Id && (
                <button
                  type="button"
                  onClick={handleCancelEditR1}
                  className="text-xs text-rose-600 hover:underline font-bold"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            <form onSubmit={handleAddOrUpdateR1} className="space-y-4">
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
                  Options & Correct Answer (Click Radio to Select Correct)
                </label>
                {r1Options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="r1Correct"
                      checked={r1CorrectIndex === idx}
                      onChange={() => setR1CorrectIndex(idx)}
                      className="text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                      title="Mark as correct answer"
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

              <div className="flex items-center gap-2 pt-2">
                {editingR1Id && (
                  <button
                    type="button"
                    onClick={handleCancelEditR1}
                    className="btn-secondary flex-1 text-xs py-2.5 font-bold"
                  >
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn-primary flex-1 text-xs py-2.5 font-bold">
                  {editingR1Id ? 'Update Quiz Question' : 'Save Quiz Question'}
                </button>
              </div>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                Quiz Questions ({quizQuestions.length})
              </h3>
              <span className="text-xs text-slate-500">
                Total questions in Round 1 pool
              </span>
            </div>

            {quizQuestions.length === 0 ? (
              <div className="card p-8 text-center text-slate-400">
                No quiz questions added yet. Use the form on the left to add one.
              </div>
            ) : (
              quizQuestions.map((q, i) => (
                <div
                  key={q.id}
                  className={`card p-4 border transition-all ${
                    editingR1Id === q.id
                      ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-2.5 flex-1">
                      <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <div className="font-bold text-slate-900 text-sm">{q.question_text}</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditR1(q)}
                        className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 text-xs font-bold"
                        title="Edit question"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteR1(q.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-bold"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-medium pl-8">
                    {(Array.isArray(q.options) ? q.options : []).map((opt: any, idx: number) => {
                      const displayOpt =
                        typeof opt === 'string'
                          ? opt
                          : typeof opt === 'object' && opt !== null
                          ? opt.title || JSON.stringify(opt)
                          : String(opt);
                      const isCorrect = idx === q.correct_index;
                      return (
                        <div
                          key={idx}
                          className={`p-2 rounded border flex items-center gap-1.5 ${
                            isCorrect
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                              : 'bg-slate-50 text-slate-700 border-slate-100'
                          }`}
                        >
                          <span className="font-mono text-slate-400">
                            {String.fromCharCode(65 + idx)}.
                          </span>
                          <span>{displayOpt}</span>
                          {isCorrect && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ROUND 2 WORKFLOW */}
      {activeTab === 2 && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Authoring Form */}
            <div className="card p-6 border-indigo-100 h-fit shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Shuffle className="w-4 h-4 text-indigo-600" />
                  {editingWorkflowId ? 'Edit Workflow Challenge' : 'Create Workflow Challenge'}
                </h3>
                {editingWorkflowId && (
                  <button
                    type="button"
                    onClick={handleCancelEditR2}
                    className="text-xs text-rose-600 hover:underline font-bold"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-5">
                Configure the ordered workflow steps and distractor options for teams to arrange.
              </p>

              <form onSubmit={handleSaveOrUpdateR2} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Challenge Title / Instruction
                  </label>
                  <input
                    type="text"
                    required
                    value={r2Title}
                    onChange={(e) => setR2Title(e.target.value)}
                    placeholder="e.g. Find the data life cycle workflow"
                    className="input-field text-sm font-semibold"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                      Real Sequence Steps (In Correct Order):
                    </label>
                    <button
                      type="button"
                      onClick={() => setR2RealSteps([...r2RealSteps, '📌 New Step'])}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      + Add Step
                    </button>
                  </div>
                  <div className="space-y-2">
                    {r2RealSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center font-mono shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          required
                          value={step}
                          onChange={(e) => {
                            const copy = [...r2RealSteps];
                            copy[idx] = e.target.value;
                            setR2RealSteps(copy);
                          }}
                          className="input-field text-xs py-2 font-semibold"
                        />
                        {r2RealSteps.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setR2RealSteps(r2RealSteps.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600 shrink-0"
                            title="Remove step"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-rose-700">
                      Distractor Steps (Irrelevant Options to Filter Out):
                    </label>
                    <button
                      type="button"
                      onClick={() => setR2Distractors([...r2Distractors, '❌ Distractor Option'])}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      + Add Distractor
                    </button>
                  </div>
                  <div className="space-y-2">
                    {r2Distractors.map((dis, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center font-mono shrink-0">
                          ✕
                        </span>
                        <input
                          type="text"
                          required
                          value={dis}
                          onChange={(e) => {
                            const copy = [...r2Distractors];
                            copy[idx] = e.target.value;
                            setR2Distractors(copy);
                          }}
                          className="input-field text-xs py-2 text-rose-950 font-medium"
                        />
                        {r2Distractors.length > 1 && (
                          <button
                            type="button"
                            onClick={() => setR2Distractors(r2Distractors.filter((_, i) => i !== idx))}
                            className="p-1 text-slate-400 hover:text-rose-600 shrink-0"
                            title="Remove distractor"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  {editingWorkflowId && (
                    <button
                      type="button"
                      onClick={handleCancelEditR2}
                      className="btn-secondary flex-1 py-2.5 font-bold text-xs"
                    >
                      Cancel
                    </button>
                  )}
                  <button type="submit" className="btn-primary flex-1 py-2.5 font-bold text-xs">
                    {editingWorkflowId ? 'Update Workflow Challenge' : 'Save Workflow Challenge'}
                  </button>
                </div>
              </form>
            </div>

            {/* List Section: Show created workflows with count, edit & delete */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Workflow Challenges ({workflowChallenges.length})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Active workflows configured for Round 2
                  </p>
                </div>
              </div>

              {workflowChallenges.length === 0 ? (
                <div className="card p-8 text-center text-slate-400">
                  No workflow challenges created yet. Use the authoring form to create one.
                </div>
              ) : (
                workflowChallenges.map((wf, idx) => {
                  const rawUrls: string[] = Array.isArray(wf.image_urls) ? wf.image_urls : [];
                  const distractorIdx = rawUrls.findIndex((s) => s.includes('__DISTRACTOR__'));
                  const realSteps = distractorIdx !== -1 ? rawUrls.slice(0, distractorIdx) : rawUrls;
                  const distractorSteps = distractorIdx !== -1 ? rawUrls.slice(distractorIdx + 1) : [];

                  return (
                    <div
                      key={wf.id}
                      className={`card p-5 border transition-all ${
                        editingWorkflowId === wf.id
                          ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4 mb-3 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-800 text-xs font-mono font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {wf.title || 'Workflow Sequence Challenge'}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 mt-1 pl-8">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {realSteps.length} Real Steps
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                              {distractorSteps.length} Distractors
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEditR2(wf)}
                            className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1 text-xs font-bold"
                            title="Edit workflow"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteR2(wf.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1 text-xs font-bold"
                            title="Delete workflow"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>

                      {/* Steps Visual Preview */}
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                            Correct Sequence Order:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {realSteps.map((step, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold"
                              >
                                <span className="text-[10px] font-bold font-mono opacity-70">
                                  {sIdx + 1}.
                                </span>
                                {step}
                              </span>
                            ))}
                          </div>
                        </div>

                        {distractorSteps.length > 0 && (
                          <div className="pt-1">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                              Distractors:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {distractorSteps.map((dis, dIdx) => (
                                <span
                                  key={dIdx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-900 border border-rose-200 font-medium line-through opacity-80"
                                >
                                  {dis}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ROUND 3 AI VS REAL */}
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
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SPOT THE DATA ANOMALY (DYNAMIC INTERACTIVE TABLE CREATOR) */}
      {activeTab === 4 && (
        <div className="space-y-8">
          {/* Quick Presets Banner */}
          <div className="bg-indigo-900 text-white p-6 rounded-2xl border border-indigo-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-xl">
            <div>
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
                INTERACTIVE DATA TABLE CREATOR & TEMPLATES
              </span>
              <h2 className="text-xl font-extrabold text-white mt-1">Design & Manage Data Anomaly Tables</h2>
              <p className="text-xs text-indigo-200 mt-1 max-w-xl">
                Choose from 13 standard real-world anomaly templates (Banking, Library, Taxi, Attendance, Food, Logistics, etc.) or design custom tables from scratch.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <select
                onChange={(e) => {
                  const idx = parseInt(e.target.value, 10);
                  if (!isNaN(idx) && ROUND_4_TEMPLATES[idx]) {
                    handleLoadTemplate(ROUND_4_TEMPLATES[idx]);
                  }
                }}
                defaultValue=""
                className="px-3.5 py-2 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-xs transition-all border border-indigo-500 shadow-xs focus:outline-none focus:ring-2 focus:ring-amber-400 cursor-pointer"
              >
                <option value="" disabled>
                  📋 Load 1 of 13 Standard Templates...
                </option>
                {ROUND_4_TEMPLATES.map((tpl, i) => (
                  <option key={i} value={i}>
                    {i + 1}. {tpl.name}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handlePreFillAll13R4Questions}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all border border-amber-400 shadow-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Pre-fill All 13 Standard Challenges
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Table Builder Form */}
            <div className="lg:col-span-2 card p-6 border-indigo-100 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-600" />
                  {editingR4Id ? 'Edit Data Table Question' : 'Create New Data Table Question'}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShuffleR4Rows}
                    className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5 text-amber-600" /> Shuffle Rows
                  </button>
                  {editingR4Id && (
                    <button
                      type="button"
                      onClick={() => setEditingR4Id(null)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                    >
                      Cancel Edit
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleAddOrUpdateR4} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Task Instruction / Question Prompt
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={r4TaskInstruction}
                    onChange={(e) => setR4TaskInstruction(e.target.value)}
                    placeholder="e.g. Task: Identify the anomalous row(s) and explain the anomaly type."
                    className="input-field text-sm font-semibold"
                  />
                </div>

                {/* Columns Controls */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-indigo-900">
                      Table Column Headers ({r4Headers.length}):
                    </label>
                    <button
                      type="button"
                      onClick={handleAddR4Column}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      + Add Column
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {r4Headers.map((h, colIdx) => (
                      <div key={colIdx} className="flex items-center gap-1 bg-slate-50 p-1.5 rounded border border-slate-200">
                        <input
                          type="text"
                          required
                          value={h}
                          onChange={(e) => {
                            const copy = [...r4Headers];
                            copy[colIdx] = e.target.value;
                            setR4Headers(copy);
                          }}
                          className="input-field text-xs py-1 px-2 font-mono font-bold"
                        />
                        {r4Headers.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveR4Column(colIdx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Rows & Cells Builder */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-emerald-800">
                      Data Table Rows ({r4Rows.length}) & Mark Correct Anomalous Row:
                    </label>
                    <button
                      type="button"
                      onClick={handleAddR4Row}
                      className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                    >
                      + Add Row
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-2xs bg-slate-900 text-white">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800 uppercase tracking-wider">
                          <th className="py-2.5 px-3 w-12 text-center">Correct</th>
                          <th className="py-2.5 px-3 w-12 text-center">#</th>
                          {r4Headers.map((h, i) => (
                            <th key={i} className="py-2.5 px-3 border-l border-slate-800 font-mono">
                              {h}
                            </th>
                          ))}
                          <th className="py-2.5 px-3 w-12 text-center border-l border-slate-800">Del</th>
                        </tr>
                      </thead>
                      <tbody>
                        {r4Rows.map((row, rowIdx) => {
                          const isCorrect = rowIdx === r4CorrectRowIndex;
                          return (
                            <tr
                              key={rowIdx}
                              className={`border-b border-slate-800 transition-colors ${
                                isCorrect ? 'bg-amber-500/20 text-white font-bold' : 'hover:bg-slate-800/60'
                              }`}
                            >
                              <td className="py-2 px-3 text-center">
                                <input
                                  type="radio"
                                  name="correctRowRadio"
                                  checked={isCorrect}
                                  onChange={() => setR4CorrectRowIndex(rowIdx)}
                                  className="w-4 h-4 text-amber-500 focus:ring-amber-400 cursor-pointer"
                                  title="Mark as Anomalous Row"
                                />
                              </td>
                              <td className="py-2 px-3 text-center font-mono font-bold text-slate-400">
                                {rowIdx + 1}
                              </td>
                              {row.map((cell, colIdx) => (
                                <td key={colIdx} className="py-1 px-2 border-l border-slate-800">
                                  <input
                                    type="text"
                                    value={cell}
                                    onChange={(e) => {
                                      const copyRows = [...r4Rows];
                                      copyRows[rowIdx][colIdx] = e.target.value;
                                      setR4Rows(copyRows);
                                    }}
                                    className="w-full bg-slate-950/80 text-white text-xs px-2 py-1.5 rounded border border-slate-700 font-medium focus:border-amber-400 focus:outline-none"
                                  />
                                </td>
                              ))}
                              <td className="py-2 px-2 text-center border-l border-slate-800">
                                {r4Rows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveR4Row(rowIdx)}
                                    className="p-1 text-slate-400 hover:text-rose-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-2 text-xs font-bold text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200 flex items-center justify-between">
                    <span>
                      ✔ Currently marked Anomalous Row: <strong>Row {r4CorrectRowIndex + 1}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={handleShuffleR4Rows}
                      className="text-indigo-600 hover:underline font-bold flex items-center gap-1"
                    >
                      <Shuffle className="w-3.5 h-3.5" /> Shuffle Row Order
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary w-full py-3 text-sm font-extrabold gap-2">
                  <Save className="w-4 h-4" /> {editingR4Id ? 'Update Data Table Question' : 'Save Data Table Question'}
                </button>
              </form>
            </div>

            {/* Saved Questions List */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-slate-900">Configured Table Questions ({dataQuestions.length})</h3>

              {dataQuestions.length === 0 ? (
                <div className="card text-center py-10 text-slate-400">
                  No table questions created yet. Use the builder on the left to add one!
                </div>
              ) : (
                dataQuestions.map((q) => {
                  const opts = q.options;
                  const isObject = opts && typeof opts === 'object' && !Array.isArray(opts) && opts.headers;
                  const headers: string[] = isObject ? opts.headers : ['Option Text'];
                  const rows: string[][] = isObject ? opts.rows : (opts || []).map((o: string) => [o]);

                  return (
                    <div key={q.id} className="card p-4 border-slate-200 space-y-3 relative group">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-extrabold text-slate-900 text-sm leading-snug">{q.question_text}</div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleEditR4(q)}
                            className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Edit Table Question"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteR4(q.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Table Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="overflow-x-auto border border-slate-200 rounded-lg bg-slate-900 text-white text-[11px]">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800">
                              <th className="p-1.5 text-center">#</th>
                              {headers.map((h, i) => (
                                <th key={i} className="p-1.5 border-l border-slate-800 font-mono">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {rows.map((r, rIdx) => {
                              const isCorrect = rIdx === q.correct_index;
                              return (
                                <tr key={rIdx} className={`border-b border-slate-800 ${isCorrect ? 'bg-amber-500/20 text-amber-300 font-extrabold' : ''}`}>
                                  <td className="p-1.5 text-center font-mono">{rIdx + 1}</td>
                                  {r.map((c, cIdx) => (
                                    <td key={cIdx} className="p-1.5 border-l border-slate-800">
                                      {c}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      <div className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Anomalous Row: Row {q.correct_index + 1}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DECODE WORDS */}
      {activeTab === 5 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card h-fit space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Add to Target Word Pool</h3>
            <form onSubmit={handleAddR5} className="space-y-4">
              {/* Target Word Input with Live Alphabet Numbers */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Target Word (e.g. ELEPHANT)
                </label>
                <input
                  type="text"
                  required
                  value={r5TargetWord}
                  onChange={(e) => setR5TargetWord(e.target.value.toUpperCase())}
                  placeholder="e.g. ELEPHANT"
                  className="input-field text-sm font-mono uppercase font-bold tracking-wider"
                />

                {/* Live Alphabet Position Conversion */}
                {r5TargetWord.trim().length > 0 && (
                  <div className="mt-2 p-2.5 bg-indigo-50/70 border border-indigo-100 rounded-xl space-y-1.5 animate-in fade-in">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 block">
                      Alphabet Position Numerical Values:
                    </span>
                    <div className="flex flex-wrap gap-1.5 font-mono text-xs">
                      {r5TargetWord
                        .toUpperCase()
                        .replace(/[^A-Z]/g, '')
                        .split('')
                        .map((char, idx) => {
                          const pos = char.charCodeAt(0) - 64;
                          return (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-white rounded-md border border-indigo-200 font-bold text-indigo-900 shadow-xs"
                            >
                              <strong>{char}</strong> = {pos}
                            </span>
                          );
                        })}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono pt-1">
                      Sequence: [
                      {r5TargetWord
                        .toUpperCase()
                        .replace(/[^A-Z]/g, '')
                        .split('')
                        .map((char) => char.charCodeAt(0) - 64)
                        .join(', ')}
                      ]
                    </div>
                  </div>
                )}
              </div>

              {/* Binary Clue Input with Live Decimal Conversion */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Binary Code (e.g. 1101110101)
                </label>
                <input
                  type="text"
                  required
                  value={r5BinaryClue}
                  onChange={(e) => setR5BinaryClue(e.target.value)}
                  placeholder="e.g. 1101110101"
                  className="input-field text-sm font-mono font-bold tracking-wider"
                />

                {/* Live Decimal Conversion */}
                {r5BinaryClue.trim().length > 0 && (
                  <div className="mt-2 p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1 animate-in fade-in">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">
                      Binary Decimal Equivalent:
                    </span>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-base font-black text-amber-700">
                        {(() => {
                          const clean = r5BinaryClue.replace(/[^01]/g, '');
                          return clean ? parseInt(clean, 2) : 0;
                        })()}
                      </span>
                      <span className="text-[10px] text-slate-500 font-sans">
                        (Base-2 to Base-10 integer value)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Live Combined Expected Password Preview */}
              {r5TargetWord.trim() && r5BinaryClue.trim() && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 animate-in fade-in">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                    Combined Expected Finale Password:
                  </span>
                  <div className="font-mono text-base font-black text-emerald-700 break-all">
                    {(() => {
                      const cleanBin = r5BinaryClue.replace(/[^01]/g, '');
                      const dec = cleanBin ? parseInt(cleanBin, 2) : 0;
                      const cleanW = r5TargetWord.toLowerCase().replace(/[^a-z]/g, '');
                      return `${dec}${cleanW}`;
                    })()}
                  </div>
                  <span className="text-[10px] text-slate-500 font-sans block">
                    (Validation is case-insensitive: member can enter uppercase or lowercase)
                  </span>
                </div>
              )}

              <button type="submit" className="btn-primary w-full text-xs py-2.5 font-bold">
                Save to Decode Pool
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900">Decode Word Pool ({decodePool.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {decodePool.map((w) => {
                const cleanBin = (w.binary_clue || '').replace(/[^01]/g, '');
                const decVal = cleanBin ? parseInt(cleanBin, 2) : 0;
                const cleanWord = (w.target_word || '').toLowerCase().replace(/[^a-z]/g, '');
                const finalPass = `${decVal}${cleanWord}`;
                const letters = (w.target_word || '')
                  .toUpperCase()
                  .replace(/[^A-Z]/g, '')
                  .split('');

                return (
                  <div key={w.id} className="card p-5 border-slate-200 flex flex-col justify-between gap-3 hover:border-indigo-200 transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-lg font-black text-indigo-700 tracking-wide">
                          {w.target_word}
                        </div>

                        {/* Letter positions */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {letters.map((char: string, idx: number) => {
                            const pos = char.charCodeAt(0) - 64;
                            return (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono font-bold text-slate-700"
                              >
                                {char}={pos}
                              </span>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteR5(w.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors shrink-0"
                        title="Delete Word"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono text-xs">
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] font-sans font-bold text-slate-400">Binary Clue:</span>
                        <span className="font-bold text-slate-800 tracking-wider">{w.binary_clue}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-600">
                        <span className="text-[11px] font-sans font-bold text-slate-400">Binary Decimal:</span>
                        <span className="font-extrabold text-amber-600">{decVal}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 text-emerald-800">
                        <span className="text-[11px] font-sans font-bold text-slate-400">Final Password:</span>
                        <span className="font-black text-emerald-600">{finalPass}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ROUND 6 PROBLEM STATEMENTS */}
      {activeTab === 6 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="card h-fit space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {editingPsId ? 'Edit Problem Statement' : 'Add Problem Statement'}
              </h3>
              {editingPsId && (
                <button
                  type="button"
                  onClick={handleCancelEditProblemStatement}
                  className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-bold"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
              )}
            </div>

            <form onSubmit={handleSaveProblemStatement} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Problem Title
                </label>
                <input
                  type="text"
                  required
                  value={psTitle}
                  onChange={(e) => setPsTitle(e.target.value)}
                  placeholder="e.g. AI-Powered Healthcare Consent Protocol"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Category / Domain
                </label>
                <input
                  type="text"
                  required
                  value={psCategory}
                  onChange={(e) => setPsCategory(e.target.value)}
                  placeholder="e.g. AI & Healthcare / Blockchain / IoT"
                  className="input-field text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Detailed Description & Requirements
                </label>
                <textarea
                  required
                  rows={6}
                  value={psDescription}
                  onChange={(e) => setPsDescription(e.target.value)}
                  placeholder="Describe the challenge statement, core expectations, functional requirements, and target outputs for the teams..."
                  className="input-field text-xs font-sans leading-relaxed"
                />
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1 text-xs py-2.5 font-bold">
                  {editingPsId ? 'Update Statement' : 'Save Problem Statement'}
                </button>
              </div>
            </form>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleLoadSampleProblemStatements}
                className="btn-secondary w-full text-xs py-2.5 font-bold flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Pre-fill 6 Standard Hackathon Challenges
              </button>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                Problem Statement Pool ({problemStatements.length})
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Admin can configure per-slot card limit in <strong>Slot Manager</strong>.
              </span>
            </div>

            {problemStatements.length === 0 ? (
              <div className="card text-center py-12 text-slate-400">
                No problem statements added yet. Create one or load sample challenges.
              </div>
            ) : (
              <div className="space-y-4">
                {problemStatements.map((ps, idx) => (
                  <div
                    key={ps.id || idx}
                    className="card p-5 border-slate-200 hover:border-indigo-200 transition-all flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-bold font-mono">
                            PS #{idx + 1}
                          </span>
                          <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-bold">
                            {ps.category || 'General'}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-base">{ps.title}</h4>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleEditProblemStatement(ps)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                          title="Edit Statement"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProblemStatement(ps.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Delete Statement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                      {ps.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
