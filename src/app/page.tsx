'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Send,
  RotateCcw,
  ChevronRight,
  Code2,
  Server,
  Users,
  BarChart3,
  Sparkles,
  Target,
  Zap,
  Trophy,
  ArrowLeft,
  Loader2,
  Briefcase,
  GraduationCap,
  Star,
  PanelLeftOpen,
  X,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  useInterviewStore,
  type CandidateProfile,
  type InterviewMessage,
  type QuestionType,
  type Difficulty,
  type Role,
  type ExperienceLevel,
} from '@/lib/interview-store';
import { useToast } from '@/hooks/use-toast';

// ─── Auto-Resize Textarea Hook ─────────────────────────────────
function useAutoResizeTextarea(value: string, maxHeight: number = 160) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = ref.current;
    if (!textarea) return;
    textarea.style.height = '44px';
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  return ref;
}

// ─── Profile Setup Component ─────────────────────────────────────
function ProfileSetup() {
  const { setProfile, startInterview } = useInterviewStore();
  const { toast } = useToast();
  const [form, setForm] = useState({
    role: '' as Role | '',
    level: '' as ExperienceLevel | '',
    skills: '',
    previousScore: '',
  });

  const handleSubmit = () => {
    if (!form.role || !form.level) {
      toast({
        title: 'Missing fields',
        description: 'Please select a role and experience level.',
        variant: 'destructive',
      });
      return;
    }

    setProfile(form as CandidateProfile);
    startInterview();
  };

  const roles: { value: Role; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: 'SDE', label: 'SDE', icon: <Code2 className="h-4 w-4" />, desc: 'Software Development' },
    { value: 'Frontend', label: 'Frontend', icon: <Zap className="h-4 w-4" />, desc: 'React, Vue, Angular' },
    { value: 'Backend', label: 'Backend', icon: <Server className="h-4 w-4" />, desc: 'APIs & Services' },
    { value: 'Full Stack', label: 'Full Stack', icon: <Sparkles className="h-4 w-4" />, desc: 'End-to-End Dev' },
    { value: 'DevOps', label: 'DevOps', icon: <Server className="h-4 w-4" />, desc: 'CI/CD & Infra' },
    { value: 'Data Analyst', label: 'Data Analyst', icon: <BarChart3 className="h-4 w-4" />, desc: 'Insights & SQL' },
    { value: 'ML Engineer', label: 'ML Engineer', icon: <Brain className="h-4 w-4" />, desc: 'AI & Models' },
  ];

  const levels: { value: ExperienceLevel; label: string; description: string; emoji: string }[] = [
    { value: 'Beginner', label: 'Beginner', description: '0-2 years', emoji: '🌱' },
    { value: 'Intermediate', label: 'Intermediate', description: '2-5 years', emoji: '🚀' },
    { value: 'Senior', label: 'Senior', description: '5+ years', emoji: '⭐' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl relative"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20"
          >
            <Brain className="h-8 w-8" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            AI Technical Interviewer
          </h1>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Practice with an AI interviewer that adapts to your skill level in real-time
          </p>
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[
            { icon: <Target className="h-3 w-3" />, text: 'Adaptive Difficulty' },
            { icon: <Code2 className="h-3 w-3" />, text: 'DSA & System Design' },
            { icon: <Users className="h-3 w-3" />, text: 'HR Questions' },
          ].map((f) => (
            <Badge key={f.text} variant="secondary" className="gap-1.5 py-1.5 px-3 text-xs">
              {f.icon}
              {f.text}
            </Badge>
          ))}
        </div>

        {/* Profile Form Card */}
        <Card className="border-2 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Candidate Profile
            </CardTitle>
            <CardDescription>
              Tell us about yourself so we can tailor the interview experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Target Role <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                    className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all hover:scale-[1.03] active:scale-[0.97] ${
                      form.role === r.value
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                        form.role === r.value ? 'bg-primary text-primary-foreground' : 'bg-muted'
                      }`}
                    >
                      {r.icon}
                    </div>
                    <span className="text-xs font-semibold leading-tight">{r.label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight text-center">{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Experience Level <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {levels.map((l) => (
                  <button
                    key={l.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, level: l.value }))}
                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all hover:scale-[1.03] active:scale-[0.97] ${
                      form.level === l.value
                        ? 'border-primary bg-primary/5 text-primary shadow-sm'
                        : 'border-border hover:border-primary/40 hover:bg-muted/50'
                    }`}
                  >
                    <span className="text-xl mb-1">{l.emoji}</span>
                    <span className="font-semibold text-sm">{l.label}</span>
                    <span className="text-xs text-muted-foreground mt-0.5">{l.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Key Skills
              </Label>
              <Input
                placeholder="e.g., React, Node.js, Python, System Design..."
                value={form.skills}
                onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated skills to focus the interview on relevant topics
              </p>
            </div>

            {/* Previous Score */}
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Star className="h-4 w-4" />
                Previous Performance (Optional)
              </Label>
              <Select
                value={form.previousScore}
                onValueChange={(v) => setForm((f) => ({ ...f, previousScore: v }))}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Select your previous interview score" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 - Needs Improvement</SelectItem>
                  <SelectItem value="2">2 - Below Average</SelectItem>
                  <SelectItem value="3">3 - Average</SelectItem>
                  <SelectItem value="4">4 - Above Average</SelectItem>
                  <SelectItem value="5">5 - Excellent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Start Button */}
            <Button
              onClick={handleSubmit}
              className="w-full h-12 text-base font-semibold gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-lg shadow-primary/20"
              size="lg"
              disabled={!form.role || !form.level}
            >
              <Sparkles className="h-5 w-5" />
              Start Interview
              <ChevronRight className="h-5 w-5" />
            </Button>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by AI • Questions adapt to your level in real-time
        </p>
      </motion.div>
    </div>
  );
}

// ─── Question Type Icon ─────────────────────────────────────────
function QuestionTypeIcon({ type }: { type: QuestionType }) {
  switch (type) {
    case 'DSA':
      return <Code2 className="h-3.5 w-3.5" />;
    case 'System Design':
      return <Server className="h-3.5 w-3.5" />;
    case 'HR/Behavioral':
      return <Users className="h-3.5 w-3.5" />;
  }
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const config = {
    easy: {
      className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      dot: 'bg-emerald-500',
    },
    medium: {
      className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      dot: 'bg-amber-500',
    },
    hard: {
      className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      dot: 'bg-rose-500',
    },
  };

  return (
    <Badge variant="outline" className={`${config[difficulty].className} text-xs font-medium gap-1.5`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config[difficulty].dot}`} />
      {difficulty.toUpperCase()}
    </Badge>
  );
}

function TypeBadge({ type }: { type: QuestionType }) {
  const config = {
    DSA: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
    'System Design': 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20',
    'HR/Behavioral': 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20',
  };

  return (
    <Badge variant="outline" className={`${config[type]} text-xs font-medium gap-1`}>
      <QuestionTypeIcon type={type} />
      {type}
    </Badge>
  );
}

// ─── Stats Panel ─────────────────────────────────────────────────
function StatsPanel({ compact = false }: { compact?: boolean }) {
  const { stats, profile, phase, completeInterview } = useInterviewStore();

  return (
    <div className={`space-y-4 ${compact ? 'p-4' : ''}`}>
      {/* Profile Summary */}
      {profile && (
        <Card className="border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Candidate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Role</span>
              <Badge variant="secondary" className="text-xs">{profile.role}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Level</span>
              <Badge variant="secondary" className="text-xs">{profile.level}</Badge>
            </div>
            {profile.skills && (
              <div className="pt-1">
                <span className="text-xs text-muted-foreground">Skills</span>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {profile.skills.split(',').map((s, i) => (
                    <Badge key={i} variant="outline" className="text-xs py-0">
                      {s.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Question Stats */}
      <Card className="border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Interview Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="text-center py-1">
            <div className="text-4xl font-bold tabular-nums">{stats.totalQuestions}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Questions Asked</div>
          </div>

          {/* Type Distribution */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">By Type</div>
            <div className="space-y-2.5">
              {[
                { label: 'DSA', count: stats.dsaCount, color: 'bg-violet-500', icon: <Code2 className="h-3 w-3" /> },
                { label: 'System Design', count: stats.systemDesignCount, color: 'bg-cyan-500', icon: <Server className="h-3 w-3" /> },
                { label: 'HR/Behavioral', count: stats.hrCount, color: 'bg-orange-500', icon: <Users className="h-3 w-3" /> },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">{item.icon}{item.label}</span>
                    <span className="font-semibold tabular-nums">{item.count}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-700 ease-out`}
                      style={{
                        width: stats.totalQuestions
                          ? `${(item.count / stats.totalQuestions) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="space-y-2.5">
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">By Difficulty</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Easy', count: stats.easyCount, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                { label: 'Medium', count: stats.mediumCount, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                { label: 'Hard', count: stats.hardCount, color: 'text-rose-500', bg: 'bg-rose-500/10' },
              ].map((item) => (
                <div key={item.label} className={`text-center p-2.5 rounded-lg ${item.bg}`}>
                  <div className={`text-xl font-bold tabular-nums ${item.color}`}>{item.count}</div>
                  <div className="text-[10px] text-muted-foreground font-medium">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* End Interview Button */}
      {phase === 'interview' && stats.totalQuestions >= 1 && (
        <Button
          variant="outline"
          className="w-full gap-2 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 transition-colors"
          onClick={completeInterview}
        >
          <Trophy className="h-4 w-4" />
          End Interview
        </Button>
      )}
    </div>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────
function MessageBubble({ message }: { message: InterviewMessage }) {
  const isInterviewer = message.role === 'interviewer';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-2.5 ${isInterviewer ? 'justify-start' : 'justify-end'}`}
    >
      {isInterviewer && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mt-1 shadow-sm">
          <Brain className="h-4 w-4 text-primary-foreground" />
        </div>
      )}

      <div
        className={`max-w-[85%] sm:max-w-[75%] space-y-2 ${
          isInterviewer
            ? 'bg-card border shadow-sm rounded-2xl rounded-tl-md'
            : 'bg-primary text-primary-foreground rounded-2xl rounded-tr-md shadow-sm'
        } px-4 py-3`}
      >
        {/* Question metadata */}
        {isInterviewer && message.questionType && message.difficulty && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <TypeBadge type={message.questionType} />
            <DifficultyBadge difficulty={message.difficulty} />
          </div>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <div className={`text-[10px] ${isInterviewer ? 'text-muted-foreground' : 'text-primary-foreground/60'}`}>
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>

      {!isInterviewer && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
          <MessageCircle className="h-4 w-4 text-muted-foreground" />
        </div>
      )}
    </motion.div>
  );
}

// ─── Typing Indicator ────────────────────────────────────────────
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex gap-2.5 justify-start"
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center mt-1 shadow-sm">
        <Brain className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="bg-card border shadow-sm rounded-2xl rounded-tl-md px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:0ms]" />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:150ms]" />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce [animation-delay:300ms]" />
          </div>
          <span className="text-xs text-muted-foreground">Generating question...</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Interview Chat Component ────────────────────────────────────
function InterviewChat() {
  const {
    profile,
    messages,
    stats,
    isLoading,
    addMessage,
    setIsLoading,
    updateCurrentQuestion,
    incrementStats,
    resetInterview,
    completeInterview,
    phase,
  } = useInterviewStore();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useAutoResizeTextarea(input);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(scrollToBottom, 50);
    return () => clearTimeout(timer);
  }, [messages, isLoading, scrollToBottom]);

  // Auto-start: generate first question when entering interview phase
  useEffect(() => {
    if (phase === 'interview' && !interviewStarted && profile) {
      setInterviewStarted(true);
      generateFirstQuestion();
    }
  }, [phase, interviewStarted, profile]);

  const generateFirstQuestion = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          profile,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const msg: InterviewMessage = {
          id: crypto.randomUUID(),
          role: 'interviewer',
          content: data.question,
          questionType: data.type,
          difficulty: data.difficulty,
          timestamp: new Date(),
        };
        addMessage(msg);
        updateCurrentQuestion(data.type, data.difficulty);
        incrementStats(data.type, data.difficulty);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate question',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the interview server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const candidateMsg: InterviewMessage = {
      id: crypto.randomUUID(),
      role: 'candidate',
      content: input.trim(),
      timestamp: new Date(),
    };

    addMessage(candidateMsg);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'next',
          profile,
          messages: [...messages, candidateMsg].map((m) => ({
            role: m.role,
            content: m.content,
            questionType: m.questionType,
            difficulty: m.difficulty,
          })),
        }),
      });

      const data = await res.json();
      if (data.success) {
        const msg: InterviewMessage = {
          id: crypto.randomUUID(),
          role: 'interviewer',
          content: data.question,
          questionType: data.type,
          difficulty: data.difficulty,
          timestamp: new Date(),
        };
        addMessage(msg);
        updateCurrentQuestion(data.type, data.difficulty);
        incrementStats(data.type, data.difficulty);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to generate question',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to the interview server',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleReset = () => {
    resetInterview();
    setInterviewStarted(false);
  };

  if (phase === 'complete') {
    return <InterviewSummary onRestart={handleReset} />;
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 border-r bg-muted/20 flex-col overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-sm">AI Interviewer</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-muted-foreground">Live Session</span>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <StatsPanel />
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b flex items-center justify-between px-3 sm:px-4 flex-shrink-0 bg-background/80 backdrop-blur-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={handleReset} className="lg:hidden h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium hidden sm:inline">Interview in Progress</span>
              <span className="text-sm font-medium sm:hidden">Live</span>
            </div>
            <Badge variant="outline" className="text-xs tabular-nums">
              Q{stats.totalQuestions}
            </Badge>
            {stats.totalQuestions > 0 && (
              <Badge variant="secondary" className="text-xs gap-1 hidden sm:inline-flex">
                <Clock className="h-3 w-3" />
                {stats.easyCount}E · {stats.mediumCount}M · {stats.hardCount}H
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Mobile Stats Button */}
            <Sheet open={mobileStatsOpen} onOpenChange={setMobileStatsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                  <PanelLeftOpen className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="px-5 py-4 border-b">
                  <SheetTitle className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <Brain className="h-4 w-4 text-primary-foreground" />
                    </div>
                    AI Interviewer
                  </SheetTitle>
                </SheetHeader>
                <div className="overflow-y-auto h-[calc(100vh-80px)]">
                  <StatsPanel compact />
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs lg:hidden h-9"
              onClick={completeInterview}
              disabled={stats.totalQuestions < 1}
            >
              <Trophy className="h-3.5 w-3.5" />
              End
            </Button>
            <Button variant="ghost" size="icon" onClick={handleReset} className="h-9 w-9">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scroll-smooth">
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Preparing your first question...</p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {isLoading && <TypingIndicator />}
          </AnimatePresence>
        </div>

        {/* Input Area */}
        <div className="border-t p-3 sm:p-4 flex-shrink-0 bg-background/80 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer here... (Shift+Enter for new line)"
                  disabled={isLoading}
                  className="min-h-[44px] max-h-40 resize-none rounded-xl pr-4 py-3 text-sm"
                  rows={1}
                />
              </div>
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-11 w-11 flex-shrink-0 rounded-xl shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5 text-center">
              Press Enter to send • Shift+Enter for new line
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Interview Summary ───────────────────────────────────────────
function InterviewSummary({ onRestart }: { onRestart: () => void }) {
  const { stats, profile, messages } = useInterviewStore();

  const interviewDuration = () => {
    if (messages.length < 2) return '0 min';
    const first = new Date(messages[0].timestamp);
    const last = new Date(messages[messages.length - 1].timestamp);
    const diff = Math.round((last.getTime() - first.getTime()) / 60000);
    return diff < 1 ? '<1 min' : `${diff} min`;
  };

  const getPerformanceNote = () => {
    if (stats.hardCount > 0) return 'You tackled some hard questions - impressive!';
    if (stats.mediumCount > stats.easyCount) return 'Great progression through medium difficulty!';
    return 'Solid foundation - keep practicing!';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg relative"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 150, damping: 12 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border-2 border-primary/20 mb-4"
          >
            <Trophy className="h-10 w-10 text-primary" />
          </motion.div>
          <h1 className="text-3xl font-bold">Interview Complete!</h1>
          <p className="text-muted-foreground mt-2">{getPerformanceNote()}</p>
        </div>

        <Card className="border-2 shadow-xl shadow-black/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Session Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-muted/50 border">
                <div className="text-2xl font-bold tabular-nums">{stats.totalQuestions}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Questions</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/50 border">
                <div className="text-2xl font-bold">{interviewDuration()}</div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Duration</div>
              </div>
              <div className="text-center p-3 rounded-xl bg-muted/50 border">
                <div className="text-2xl font-bold">
                  {stats.totalQuestions > 0 ? Math.round((stats.mediumCount + stats.hardCount) / stats.totalQuestions * 100) : 0}%
                </div>
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Challenge</div>
              </div>
            </div>

            {/* Profile */}
            {profile && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/50 border">
                <Briefcase className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium">{profile.role}</span>
                <span className="text-muted-foreground">•</span>
                <span className="text-sm text-muted-foreground">{profile.level}</span>
              </div>
            )}

            {/* Type Breakdown */}
            <div className="space-y-3">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Question Types</div>
              {[
                { label: 'DSA', count: stats.dsaCount, icon: <Code2 className="h-4 w-4" />, color: 'text-violet-500' },
                { label: 'System Design', count: stats.systemDesignCount, icon: <Server className="h-4 w-4" />, color: 'text-cyan-500' },
                { label: 'HR/Behavioral', count: stats.hrCount, icon: <Users className="h-4 w-4" />, color: 'text-orange-500' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2.5 text-sm">
                    <span className={item.color}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span className="font-semibold tabular-nums">{item.count}</span>
                </div>
              ))}
            </div>

            {/* Difficulty Breakdown */}
            <div className="space-y-3">
              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Difficulty Levels</div>
              {[
                { label: 'Easy', count: stats.easyCount, color: 'bg-emerald-500', textColor: 'text-emerald-500' },
                { label: 'Medium', count: stats.mediumCount, color: 'bg-amber-500', textColor: 'text-amber-500' },
                { label: 'Hard', count: stats.hardCount, color: 'bg-rose-500', textColor: 'text-rose-500' },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className={item.textColor}>{item.label}</span>
                    <span className="font-medium tabular-nums">{item.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full rounded-full ${item.color} transition-all duration-1000 ease-out`}
                      style={{
                        width: stats.totalQuestions
                          ? `${(item.count / stats.totalQuestions) * 100}%`
                          : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <Button
              onClick={onRestart}
              className="w-full h-12 text-base font-semibold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-transform"
              size="lg"
            >
              <RotateCcw className="h-5 w-5" />
              Start New Interview
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function Home() {
  const { phase } = useInterviewStore();

  return (
    <AnimatePresence mode="wait">
      {phase === 'setup' ? (
        <motion.div key="setup" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
          <ProfileSetup />
        </motion.div>
      ) : (
        <motion.div key="interview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
          <InterviewChat />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
