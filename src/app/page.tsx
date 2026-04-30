'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
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
  Clock,
  MessageCircle,
  SkipForward,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  Timer,
  Sun,
  Moon,
  Copy,
  Check,
  Download,
  HelpCircle,
  Keyboard,
  Trash2,
  History,
  X,
  FileJson,
  ClipboardCopy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  useInterviewStore,
  type CandidateProfile,
  type InterviewMessage,
  type InterviewHistoryEntry,
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

// ─── Elapsed Timer Hook ─────────────────────────────────────────
function useElapsedTime(startTime: Date | null) {
  const [elapsed, setElapsed] = useState(() => startTime ? computeElapsed(startTime) : '00:00');

  useEffect(() => {
    if (!startTime) return;

    const update = () => {
      setElapsed(computeElapsed(startTime));
    };

    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}

function computeElapsed(startTime: Date): string {
  const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
  const mins = Math.floor(diff / 60);
  const secs = diff % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function computeDurationMinutes(startTime: Date | null, endTime?: Date | null): string {
  if (!startTime) return '0 min';
  const end = endTime || new Date();
  const diff = Math.round((new Date(end).getTime() - new Date(startTime).getTime()) / 60000);
  return diff < 1 ? '<1 min' : `${diff} min`;
}

// ─── Theme Toggle ─────────────────────────────────────────────────
function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className={`h-9 w-9 ${className}`}>
        <Sun className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className={`h-9 w-9 ${className}`}
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <AnimatePresence mode="wait" initial={false}>
              {theme === 'dark' ? (
                <motion.div key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Moon className="h-4 w-4" />
                </motion.div>
              ) : (
                <motion.div key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                  <Sun className="h-4 w-4" />
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Toggle {theme === 'dark' ? 'light' : 'dark'} mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Question Timer Ring ─────────────────────────────────────────
function QuestionTimerRing({ questionIndex, startTime }: { questionIndex: number; startTime?: Date | null }) {
  const [elapsed, setElapsed] = useState(0);
  const maxSeconds = 180; // 3 minutes

  useEffect(() => {
    if (!startTime) return;
    const interval = setInterval(() => {
      const diff = Math.floor((Date.now() - new Date(startTime).getTime()) / 1000);
      setElapsed(diff);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const progress = Math.min(elapsed / maxSeconds, 1);
  const circumference = 2 * Math.PI * 14;
  const strokeDashoffset = circumference * (1 - progress);
  const isOverTime = elapsed >= maxSeconds;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="36" height="36" className="-rotate-90">
        <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-muted/30" />
        <circle
          cx="18" cy="18" r="14" fill="none"
          strokeWidth="2.5"
          strokeLinecap="round"
          className={isOverTime ? 'text-rose-500' : 'text-primary'}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 1s linear',
          }}
        />
      </svg>
      <span className={`absolute text-[10px] font-bold ${isOverTime ? 'animate-pulse text-rose-500' : ''}`}>
        Q{questionIndex}
      </span>
    </div>
  );
}

// ─── Code Block Renderer ─────────────────────────────────────────
function CodeBlock({ code, language }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Basic syntax highlighting
  const highlightCode = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, lineIdx) => {
      let highlighted = line
        // Comments
        .replace(/(\/\/.*$|#.*$)/gm, '<span class="text-muted-foreground italic">$1</span>')
        // Strings
        .replace(/(&quot;[^&]*&quot;|&#x27;[^&]*&#x27;|"[^"]*"|'[^']*')/g, '<span class="text-emerald-400">$1</span>')
        // Keywords
        .replace(/\b(const|let|var|function|return|if|else|for|while|class|import|export|from|async|await|try|catch|throw|new|this|interface|type|enum|extends|implements|public|private|protected|static|void|null|undefined|true|false)\b/g, '<span class="text-violet-400 font-medium">$1</span>')
        // Numbers
        .replace(/\b(\d+)\b/g, '<span class="text-amber-400">$1</span>');
      return <div key={lineIdx} className="table-row" dangerouslySetInnerHTML={{ __html: highlighted || '&nbsp;' }} />;
    });
  };

  return (
    <div className="relative group rounded-lg overflow-hidden my-2">
      <div className="flex items-center justify-between bg-zinc-900 dark:bg-zinc-950 px-3 py-1.5 text-xs text-zinc-400">
        <span>{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-zinc-200 transition-colors"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="bg-zinc-900 dark:bg-zinc-950 text-zinc-200 p-3 text-xs overflow-x-auto table w-full">
        <code className="table-cell">{highlightCode(code)}</code>
      </pre>
    </div>
  );
}

// ─── Message Content with Code Block Support ──────────────────────
function MessageContent({ content }: { content: string }) {
  const parts = content.split(/(```[\s\S]*?```|`[^`]+`)/g);

  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const lines = part.slice(3, -3);
          const firstNewline = lines.indexOf('\n');
          const language = firstNewline > -1 ? lines.slice(0, firstNewline).trim() : '';
          const code = firstNewline > -1 ? lines.slice(firstNewline + 1) : lines;
          return <CodeBlock key={i} code={code} language={language || undefined} />;
        }
        if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
          return (
            <code key={i} className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Dot Grid Background ────────────────────────────────────────
function DotGridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03] dark:opacity-[0.05]">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="dotGrid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dotGrid)" />
      </svg>
    </div>
  );
}

// ─── Confetti Effect ────────────────────────────────────────────
function ConfettiEffect() {
  const colors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
  const particles = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    size: 4 + Math.random() * 6,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: 0, rotate: 720 }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'easeIn' }}
          className="absolute"
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}

// ─── Score Donut Chart ──────────────────────────────────────────
function ScoreDonut({ score, size = 140 }: { score: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - score / 10);
  const scoreColor = score >= 7 ? '#10b981' : score >= 4 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="currentColor" strokeWidth="8" className="text-muted/30"
        />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="text-5xl font-black bg-gradient-to-br from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent"
        >
          {score}
        </motion.span>
        <span className="text-xs text-muted-foreground font-medium">/10</span>
      </div>
    </div>
  );
}

// ─── Performance Badge ──────────────────────────────────────────
function PerformanceBadge({ score }: { score: number }) {
  const config = score >= 8
    ? { label: 'Strong Performer', className: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20', icon: <Trophy className="h-3 w-3" /> }
    : score >= 6
      ? { label: 'Room to Grow', className: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20', icon: <TrendingUp className="h-3 w-3" /> }
      : { label: 'Needs Improvement', className: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20', icon: <Target className="h-3 w-3" /> };

  return (
    <Badge variant="outline" className={`${config.className} text-sm font-semibold gap-1.5 py-1 px-3`}>
      {config.icon}
      {config.label}
    </Badge>
  );
}

// ─── Keyboard Shortcuts Overlay ──────────────────────────────────
function KeyboardShortcutsOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const shortcuts = [
    { keys: 'Ctrl + Enter', description: 'Send message' },
    { keys: 'Ctrl + K', description: 'Skip question' },
    { keys: 'Escape', description: 'Close dialogs' },
    { keys: '?', description: 'Toggle shortcuts' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <Card className="w-full max-w-sm border-2 shadow-2xl bg-background/95 backdrop-blur-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Keyboard className="h-4 w-4" />
                    Keyboard Shortcuts
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {shortcuts.map((s) => (
                  <div key={s.keys} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-muted-foreground">{s.description}</span>
                    <kbd className="px-2 py-1 text-xs font-mono bg-muted rounded-md border border-border">
                      {s.keys}
                    </kbd>
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Interview History ──────────────────────────────────────────
function InterviewHistoryPanel() {
  const { history, loadHistory, clearHistory } = useInterviewStore();
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  if (history.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border bg-background/60 backdrop-blur-md border-white/10 dark:border-white/5">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <History className="h-4 w-4" />
              Recent Sessions
            </CardTitle>
            <AlertDialog open={showConfirmClear} onOpenChange={setShowConfirmClear}>
              <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-rose-500" onClick={() => setShowConfirmClear(true)}>
                <Trash2 className="h-3 w-3 mr-1" />
                Clear
              </Button>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Clear History?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete all your interview history.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory} className="bg-rose-600 hover:bg-rose-700">
                    Clear All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>
        <CardContent className="max-h-48 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            {history.slice(0, 5).map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50 hover:bg-muted/60 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex-shrink-0">
                    <Badge variant="secondary" className="text-[10px]">{entry.role}</Badge>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{entry.level} · {entry.questionCount} Qs · {entry.duration}</p>
                    <p className="text-[10px] text-muted-foreground">{entry.date}</p>
                  </div>
                </div>
                {entry.score !== null && (
                  <Badge variant="outline" className={`text-xs flex-shrink-0 ${
                    entry.score >= 7 ? 'border-emerald-500/30 text-emerald-600 dark:text-emerald-400' :
                    entry.score >= 4 ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' :
                    'border-rose-500/30 text-rose-600 dark:text-rose-400'
                  }`}>
                    {entry.score}/10
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Animated Counter ────────────────────────────────────────────
function AnimatedCounter({ target, label }: { target: number; label: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let current = 0;
    const step = Math.max(1, Math.floor(target / 30));
    const interval = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      setCount(current);
    }, 30);
    return () => clearInterval(interval);
  }, [target]);

  return (
    <div className="text-center">
      <span className="text-2xl font-bold tabular-nums">{count}+</span>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
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

  const handleQuickStart = (role: Role, level: ExperienceLevel) => {
    setForm((f) => ({ ...f, role, level }));
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
    { value: 'Beginner', label: 'Beginner', description: '0-2 years', emoji: '\u{1F331}' },
    { value: 'Intermediate', label: 'Intermediate', description: '2-5 years', emoji: '\u{1F680}' },
    { value: 'Senior', label: 'Senior', description: '5+ years', emoji: '\u2B50' },
  ];

  const questionCountMap: Record<string, number> = {
    'SDE': 150, 'Frontend': 120, 'Backend': 130,
    'Full Stack': 140, 'DevOps': 100, 'Data Analyst': 90, 'ML Engineer': 110,
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {/* Background effects */}
      <DotGridBackground />
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
          <div className="flex justify-end mb-2">
            <ThemeToggle />
          </div>
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

          {/* Animated Counter */}
          {form.role && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3"
            >
              <AnimatedCounter target={questionCountMap[form.role] || 100} label="Questions Available" />
            </motion.div>
          )}
        </div>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {[
            { icon: <Target className="h-3 w-3" />, text: 'Adaptive Difficulty' },
            { icon: <Code2 className="h-3 w-3" />, text: 'DSA & System Design' },
            { icon: <Users className="h-3 w-3" />, text: 'HR Questions' },
            { icon: <TrendingUp className="h-3 w-3" />, text: 'AI Feedback' },
          ].map((f) => (
            <Badge key={f.text} variant="secondary" className="gap-1.5 py-1.5 px-3 text-xs">
              {f.icon}
              {f.text}
            </Badge>
          ))}
        </div>

        {/* Quick Start */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2 text-center">Quick Start</p>
          <div className="flex flex-wrap justify-center gap-2">
            {[
              { role: 'SDE' as Role, level: 'Intermediate' as ExperienceLevel, label: 'SDE Mid' },
              { role: 'Frontend' as Role, level: 'Beginner' as ExperienceLevel, label: 'Frontend Jr' },
              { role: 'Full Stack' as Role, level: 'Senior' as ExperienceLevel, label: 'Full Stack Sr' },
            ].map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => handleQuickStart(preset.role, preset.level)}
              >
                <Zap className="h-3 w-3 mr-1" />
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Profile Form Card - Gradient Border */}
        <div className="relative rounded-xl p-[2px] bg-gradient-to-r from-primary via-primary/50 to-primary/20">
          <Card className="border-0 shadow-xl shadow-black/5">
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
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all active:scale-[0.97] ${
                        form.role === r.value
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50 hover:rotate-[1deg] hover:shadow-md'
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
                      className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all active:scale-[0.97] ${
                        form.level === l.value
                          ? 'border-primary bg-primary/5 text-primary shadow-sm'
                          : 'border-border hover:border-primary/40 hover:bg-muted/50 hover:rotate-[1deg] hover:shadow-md'
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

              {/* Start Button - Gradient */}
              <Button
                onClick={handleSubmit}
                className="w-full h-12 text-base font-semibold gap-2 hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground"
                size="lg"
                disabled={!form.role || !form.level}
              >
                <Sparkles className="h-5 w-5" />
                Start Interview
                <ChevronRight className="h-5 w-5" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Interview History */}
        <div className="mt-4">
          <InterviewHistoryPanel />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by AI · Questions adapt to your level in real-time
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
      {/* Profile Summary - Glass */}
      {profile && (
        <Card className="border bg-background/50 backdrop-blur-md border-white/10 dark:border-white/5">
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

      {/* Question Stats - Glass */}
      <Card className="border bg-background/50 backdrop-blur-md border-white/10 dark:border-white/5">
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
        <AlertDialog>
          <Button
            variant="outline"
            className="w-full gap-2 hover:bg-rose-500/10 hover:text-rose-600 hover:border-rose-500/30 transition-colors"
            onClick={completeInterview}
          >
            <Trophy className="h-4 w-4" />
            End Interview
          </Button>
        </AlertDialog>
      )}
    </div>
  );
}

// ─── Copy Question Button ────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted/80"
      title="Copy question"
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
}

// ─── Message Bubble ──────────────────────────────────────────────
function MessageBubble({ message, questionIndex, questionStartTime }: { message: InterviewMessage; questionIndex?: number; questionStartTime?: Date | null }) {
  const isInterviewer = message.role === 'interviewer';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex justify-center"
      >
        <div className="bg-muted/60 text-muted-foreground text-xs px-4 py-2 rounded-full border">
          {message.content}
        </div>
      </motion.div>
    );
  }

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
        className={`group max-w-[85%] sm:max-w-[75%] space-y-2 transition-shadow hover:shadow-md ${
          isInterviewer
            ? 'bg-card border shadow-sm rounded-2xl rounded-tl-md'
            : 'bg-primary text-primary-foreground rounded-2xl rounded-tr-md shadow-sm'
        } px-4 py-3`}
      >
        {/* Question metadata */}
        {isInterviewer && message.questionType && message.difficulty && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {questionIndex !== undefined && (
              <QuestionTimerRing questionIndex={questionIndex} startTime={questionStartTime} />
            )}
            <TypeBadge type={message.questionType} />
            <DifficultyBadge difficulty={message.difficulty} />
          </div>
        )}
        <div className="text-sm leading-relaxed whitespace-pre-wrap">
          <MessageContent content={message.content} />
        </div>
        <div className={`flex items-center justify-between ${isInterviewer ? '' : ''}`}>
          <div className={`text-[10px] ${isInterviewer ? 'text-muted-foreground' : 'text-primary-foreground/60'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
          {isInterviewer && (
            <CopyButton text={message.content} />
          )}
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

// ─── Typing Indicator with Sound Wave ────────────────────────────
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
          {/* Sound wave bars */}
          <div className="flex items-end gap-[3px] h-4">
            {[1, 2, 3, 4, 3].map((h, i) => (
              <motion.div
                key={i}
                className="w-[3px] bg-primary/50 rounded-full"
                animate={{ height: [4, h * 4, 4] }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                  ease: 'easeInOut',
                }}
              />
            ))}
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
    interviewStartTime,
    questionStartTime,
    setQuestionStartTime,
  } = useInterviewStore();
  const { toast } = useToast();
  const [input, setInput] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useAutoResizeTextarea(input);
  const elapsed = useElapsedTime(interviewStartTime);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages, isLoading, scrollToBottom]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K = Skip
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        handleSkip();
      }
      // ? = Toggle shortcuts (only when not typing)
      if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          e.preventDefault();
          setShowShortcuts((s) => !s);
        }
      }
      // Escape = Close dialogs
      if (e.key === 'Escape') {
        setShowShortcuts(false);
        setShowResetDialog(false);
        setMobileStatsOpen(false);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  });

  // Auto-start: generate first question when entering interview phase
  useEffect(() => {
    if (phase === 'interview' && !interviewStarted && profile) {
      setInterviewStarted(true);
      addMessage({
        id: crypto.randomUUID(),
        role: 'system',
        content: `Interview started for ${profile.role} (${profile.level}). Good luck!`,
        timestamp: new Date(),
      });
      generateFirstQuestion();
    }
  }, [phase, interviewStarted, profile]);

  const generateFirstQuestion = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', profile }),
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
        setQuestionStartTime(new Date());
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to generate question', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Connection Error', description: 'Failed to connect to the interview server', variant: 'destructive' });
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
        setQuestionStartTime(new Date());
      } else {
        toast({ title: 'Error', description: data.error || 'Failed to generate question', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Connection Error', description: 'Failed to connect to the interview server', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleSkip = async () => {
    if (isLoading) return;

    addMessage({
      id: crypto.randomUUID(),
      role: 'system',
      content: 'Question skipped',
      timestamp: new Date(),
    });

    setIsLoading(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'skip',
          profile,
          messages: messages.map((m) => ({
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
        setQuestionStartTime(new Date());
      }
    } catch {
      toast({ title: 'Connection Error', description: 'Failed to generate question', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey) {
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
      {/* Desktop Sidebar - Glass */}
      <aside className="hidden lg:flex w-72 border-r bg-background/40 backdrop-blur-xl flex-col overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b bg-background/30 backdrop-blur-md">
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
        {/* Top Bar - Glass */}
        <header className="h-14 border-b flex items-center justify-between px-3 sm:px-4 flex-shrink-0 bg-background/50 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => setShowResetDialog(true)} className="lg:hidden h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium hidden sm:inline">Interview in Progress</span>
              <span className="text-sm font-medium sm:hidden">Live</span>
            </div>
            <Badge variant="outline" className="text-xs tabular-nums gap-1">
              <Timer className="h-3 w-3" />
              {elapsed}
            </Badge>
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
            {/* Keyboard Shortcuts Button */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowShortcuts(true)}>
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard shortcuts (?)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <ThemeToggle />

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
            <Button variant="ghost" size="icon" onClick={() => setShowResetDialog(true)} className="h-9 w-9">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Keyboard Shortcuts Overlay */}
        <KeyboardShortcutsOverlay open={showShortcuts} onClose={() => setShowShortcuts(false)} />

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Reset Interview?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This will end your current session and clear all progress. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset} className="bg-rose-600 hover:bg-rose-700">
                Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 scroll-smooth custom-scrollbar">
          {messages.length === 0 && !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm text-muted-foreground">Preparing your first question...</p>
              </div>
            </div>
          )}

          <AnimatePresence>
            {(() => {
              let qi = 0;
              return messages.map((msg) => {
                if (msg.role === 'interviewer' && msg.questionType) {
                  qi++;
                  return <MessageBubble key={msg.id} message={msg} questionIndex={qi} questionStartTime={questionStartTime} />;
                }
                return <MessageBubble key={msg.id} message={msg} />;
              });
            })()}
          </AnimatePresence>

          <AnimatePresence>
            {isLoading && <TypingIndicator />}
          </AnimatePresence>
        </div>

        {/* Input Area - Glass */}
        <div className="border-t p-3 sm:p-4 flex-shrink-0 bg-background/50 backdrop-blur-xl">
          <div className="max-w-3xl mx-auto">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your answer... (Enter or Ctrl+Enter to send)"
                  disabled={isLoading}
                  className="min-h-[44px] max-h-40 resize-none rounded-xl pr-4 py-3 text-sm"
                  rows={1}
                />
              </div>
              <Button
                onClick={handleSkip}
                disabled={isLoading || stats.totalQuestions < 1}
                variant="outline"
                size="icon"
                className="h-11 w-11 flex-shrink-0 rounded-xl"
                title="Skip question (Ctrl+K)"
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                onClick={handleSend}
                disabled={isLoading || !input.trim()}
                size="icon"
                className="h-11 w-11 flex-shrink-0 rounded-xl shadow-sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <p className="text-[10px] text-muted-foreground">
                Enter to send · Shift+Enter new line · Ctrl+K skip
              </p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <HelpCircle className="h-3 w-3" />
                Press ? for shortcuts
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ─── Feedback Section ────────────────────────────────────────────
function FeedbackSection({ feedback, isLoading }: { feedback: { overallScore: number; strengths: string[]; improvements: string[]; summary: string } | null; isLoading: boolean }) {
  if (isLoading) {
    return (
      <Card className="border-2 border-primary/20">
        <CardContent className="py-8">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium">Generating AI Feedback...</p>
              <p className="text-xs text-muted-foreground mt-1">Analyzing your interview performance</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!feedback) return null;

  return (
    <Card className="border-2 border-primary/20 overflow-hidden">
      {/* Header with shimmer */}
      <div className="bg-primary/5 px-6 py-4 border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-shimmer" />
        <div className="flex items-center justify-between relative">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-semibold">AI Performance Review</span>
          </div>
          <PerformanceBadge score={feedback.overallScore} />
        </div>
      </div>
      <CardContent className="p-6 space-y-5">
        {/* Score Donut */}
        <div className="flex justify-center py-2">
          <ScoreDonut score={feedback.overallScore} />
        </div>

        {/* Summary */}
        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-sm leading-relaxed">{feedback.summary}</p>
        </div>

        {/* Strengths */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4" />
            Strengths
          </div>
          <ul className="space-y-1.5">
            {feedback.strengths.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="flex items-start gap-2 text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                <span>{s}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Improvements */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-400">
            <Lightbulb className="h-4 w-4" />
            Areas for Improvement
          </div>
          <ul className="space-y-1.5">
            {feedback.improvements.map((s, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 + i * 0.1 }}
                className="flex items-start gap-2 text-sm"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                <span>{s}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Interview Summary ───────────────────────────────────────────
function InterviewSummary({ onRestart }: { onRestart: () => void }) {
  const { stats, profile, messages, feedback, feedbackLoading, setFeedback, setFeedbackLoading, interviewStartTime, saveToHistory } = useInterviewStore();
  const { toast } = useToast();
  const [feedbackRequested, setFeedbackRequested] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [exportCopied, setExportCopied] = useState(false);

  const interviewDuration = () => {
    if (messages.length < 2) return '0 min';
    const first = new Date(messages[0].timestamp);
    const last = new Date(messages[messages.length - 1].timestamp);
    const diff = Math.round((last.getTime() - first.getTime()) / 60000);
    return diff < 1 ? '<1 min' : `${diff} min`;
  };

  const getPerformanceNote = () => {
    if (stats.hardCount > 0) return 'You tackled some hard questions — impressive!';
    if (stats.mediumCount > stats.easyCount) return 'Great progression through medium difficulty!';
    return 'Solid foundation — keep practicing!';
  };

  // Request AI feedback on mount
  useEffect(() => {
    if (!feedbackRequested && profile && messages.length > 0) {
      setFeedbackRequested(true);
      requestFeedback();
    }
  }, [feedbackRequested, profile, messages]);

  // Save to history when feedback arrives
  useEffect(() => {
    if (feedback && profile) {
      const entry: InterviewHistoryEntry = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString(),
        role: profile.role,
        level: profile.level,
        score: feedback.overallScore,
        questionCount: stats.totalQuestions,
        duration: computeDurationMinutes(interviewStartTime),
        skills: profile.skills,
      };
      saveToHistory(entry);

      if (feedback.overallScore >= 7) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
  }, [feedback]);

  const requestFeedback = async () => {
    setFeedbackLoading(true);
    try {
      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'feedback',
          profile,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
            questionType: m.questionType,
            difficulty: m.difficulty,
          })),
        }),
      });

      const data = await res.json();
      if (data.success && data.feedback) {
        setFeedback(data.feedback);
      }
    } catch {
      // Feedback is optional, don't show error
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleExportJSON = () => {
    const exportData = {
      date: new Date().toISOString(),
      profile,
      stats,
      feedback,
      duration: computeDurationMinutes(interviewStartTime),
      transcript: messages.map((m) => ({
        role: m.role,
        content: m.content,
        questionType: m.questionType,
        difficulty: m.difficulty,
        timestamp: new Date(m.timestamp).toISOString(),
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exported!', description: 'Interview transcript saved as JSON' });
  };

  const handleCopyTranscript = () => {
    const lines = messages
      .filter((m) => m.role !== 'system')
      .map((m) => {
        const prefix = m.role === 'interviewer' ? 'Interviewer' : 'You';
        const tags = m.questionType ? ` [${m.questionType}, ${m.difficulty}]` : '';
        return `${prefix}${tags}: ${m.content}`;
      });
    const text = `Interview Transcript - ${profile?.role} (${profile?.level})\nDate: ${new Date().toLocaleDateString()}\nDuration: ${interviewDuration()}\nScore: ${feedback?.overallScore || 'N/A'}/10\n\n${lines.join('\n\n')}`;

    navigator.clipboard.writeText(text);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
    toast({ title: 'Copied!', description: 'Transcript copied to clipboard' });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-muted/30 relative overflow-hidden">
      {showConfetti && <ConfettiEffect />}
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
        <div className="flex justify-end mb-2">
          <ThemeToggle />
        </div>
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

        <div className="space-y-4">
          {/* AI Feedback */}
          <FeedbackSection feedback={feedback} isLoading={feedbackLoading} />

          {/* Session Stats - Glass */}
          <Card className="border-2 shadow-xl shadow-black/5 bg-background/50 backdrop-blur-md border-white/10 dark:border-white/5">
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
                  <span className="text-muted-foreground">·</span>
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

              {/* Export Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleExportJSON}
                >
                  <FileJson className="h-4 w-4" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 gap-2"
                  onClick={handleCopyTranscript}
                >
                  {exportCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <ClipboardCopy className="h-4 w-4" />}
                  {exportCopied ? 'Copied!' : 'Copy Transcript'}
                </Button>
              </div>

              <Button
                onClick={onRestart}
                className="w-full h-12 text-base font-semibold gap-2 shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-transform bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary text-primary-foreground"
                size="lg"
              >
                <RotateCcw className="h-5 w-5" />
                Start New Interview
              </Button>
            </CardContent>
          </Card>
        </div>
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
