"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUp,
  BadgeCheck,
  Check,
  ChevronDown,
  CircleHelp,
  Copy,
  Eye,
  EyeOff,
  FileCode2,
  Globe2,
  Grid2X2,
  GripVertical,
  ImagePlus,
  LayoutDashboard,
  Link2,
  List,
  MessageSquare,
  PanelLeft,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Sparkles,
  Square,
  Trash2,
  WandSparkles,
  X,
} from "lucide-react";

import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { ChatTurn } from "@/components/ai/chat";
import {
  CodeDiff,
  rowsFromInlineLines,
  rowsFromUnifiedDiff,
  type CodeDiffRow,
} from "@/components/ai/file-diff";
import { AiDataTable } from "@/components/ai/data-table";
import { AgentTodoList } from "@/components/ai/todo-list";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8001/api"
).replace(/\/$/, "");
const PROTOTYPE_PREVIEW_ORIGIN = (
  process.env.NEXT_PUBLIC_PROTOTYPE_PREVIEW_ORIGIN ?? "http://localhost:3000"
).replace(/\/$/, "");
const TEST_MODE = ["1", "true", "yes"].includes(
  (
    process.env.NEXT_PUBLIC_TEST_MODE ??
    process.env.NEXT_PUBLIC_test_mode ??
    ""
  ).toLowerCase(),
);
const DEFAULT_PROTOTYPE_PREVIEW_PATH = "/patrimony";
const SHOW_PROJECT_GUIDE_FEATURE = false;
const SHOW_REPO_SELECTOR = true;
const CHAT_PANEL_WIDTH_STORAGE_KEY = "archetype:workspace-chat-panel-width";
const CHAT_PANEL_DEFAULT_WIDTH = 380;
const CHAT_PANEL_MIN_WIDTH = 300;
const CHAT_PANEL_MAX_WIDTH = 640;
const PREVIEW_PANEL_MIN_WIDTH = 520;
const CHAT_PANEL_KEYBOARD_STEP = 24;

function clampNumber(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function constrainChatPanelWidth(value: number, containerWidth?: number) {
  const containerMaxWidth = containerWidth
    ? containerWidth - PREVIEW_PANEL_MIN_WIDTH
    : CHAT_PANEL_MAX_WIDTH;
  const maxWidth = Math.max(
    CHAT_PANEL_MIN_WIDTH,
    Math.min(CHAT_PANEL_MAX_WIDTH, containerMaxWidth),
  );

  return clampNumber(value, CHAT_PANEL_MIN_WIDTH, maxWidth);
}

type WorkspaceSummary = {
  id: string;
  name: string;
  repoName: string;
  prototypeRoot: string;
  status: "ready";
};

type AuthPayload = {
  user: {
    id: string;
    email: string;
    displayName: string;
  };
  workspace: WorkspaceSummary;
  membership: {
    id: string;
    role: string;
  };
};

type SessionSummary = {
  id: string;
  title: string;
  routeSlug: string;
  routePath: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type RunSummary = {
  id: string;
  status: string;
  targetKind: "current" | "new";
  previewUrl: string | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

type RepoConnectionData = {
  id?: string;
  repoFullName?: string;
  branch?: string;
  currentCommitSha?: string | null;
  prototypeRoot?: string;
  previewOrigin?: string;
  status: string;
  lastError?: string | null;
};

type RepoConnectionInput = {
  repoUrl: string;
  branch: string;
  prototypeRoot: string;
  previewOrigin: string;
};

type GuideEnvRequirement = {
  name: string;
  required: boolean;
  public: boolean;
  reason: string;
  sources: Array<{ file: string; label?: string }>;
};

type ProjectGuideData = {
  guide: {
    id: string;
    commitSha: string | null;
    generatedAt: string;
    stale: boolean;
    content: {
      summary?: {
        routeCount?: number;
        componentCount?: number;
        primitiveCount?: number;
        scriptCount?: number;
        styleSignalCount?: number;
        envVarCount?: number;
      };
      routes?: Array<{ file: string; routePath?: string }>;
      components?: Array<{ file: string; label?: string }>;
      primitives?: Array<{ file: string; label?: string }>;
      packageScripts?: Record<string, string>;
      styling?: Array<{ file: string; label?: string }>;
      environment?: GuideEnvRequirement[];
    };
    evidence: Record<string, unknown>;
    unsupportedPatterns: string[];
  };
};

type SaveRepoEnvironmentInput = {
  key: string;
  value: string;
  target: "development" | "preview" | "production";
  sensitive: boolean;
};

type SaveRepoEnvironmentResponse = {
  path: string;
  variableCount: number;
  keys: string[];
  target: string;
  updatedAt: string;
};

type PrototypeCardData = {
  id: string;
  files: number;
  added: number;
  removed: number;
  title: string;
  branch: string;
  status: "Ready" | "Draft" | "Review";
  owner: string;
  time: string;
  fit: string;
  learned: string;
  notes: string;
  preview: string;
  routePath: string;
  routeSlug: string;
  sessionStatus: string;
  latestRunId?: string | null;
  lastSuccessfulRunId?: string | null;
};

type DashboardSort = "lastEdited" | "systemFit" | "review";
type DashboardViewMode = "grid" | "list";

type SessionListResponse = {
  items: SessionSummary[];
};

type CreateSessionResponse = SessionSummary & {
  items: [];
};

type PrototypeItemSummary = {
  kind: "current" | "new";
  url: string;
};

type SessionDetailResponse = Pick<
  SessionSummary,
  "id" | "title" | "routePath" | "status"
> & {
  items: PrototypeItemSummary[];
  latestRun?: RunSummary | null;
  lastSuccessfulRun?: RunSummary | null;
};

type ChatMessageRole = "user" | "assistant" | "system";

type ChatMessageData = {
  id: string;
  role: ChatMessageRole;
  content: string;
  createdAt?: string;
  streaming?: boolean;
};

type SessionMessagesResponse = {
  items: ChatMessageData[];
};

type SessionLiveEvent =
  | "session_status"
  | "ai_delta"
  | "current_ready"
  | "new_reloading"
  | "new_ready";

type SessionEventPayload = {
  delta?: string;
  message?: string;
  runId?: string;
  status?: string;
  url?: string;
};

type RunEventData = {
  id: string;
  runId: string;
  type: string;
  source: string;
  message: string | null;
  payload: Record<string, unknown>;
  createdAt: string;
};

type HandoffFileData = {
  file: string;
  added: number;
  removed: number;
};

type HandoffData = {
  run: RunSummary & {
    inputCommitSha?: string | null;
    outputCommitSha?: string | null;
    outputPath?: string | null;
  };
  summary: string;
  files: HandoffFileData[];
  diffSnippet: string[];
  tests: {
    status: string;
    commands: string[];
    results?: Array<{
      command: string;
      status: string;
      exitCode: number | null;
      durationMs: number;
      outputSnippet: string;
    }>;
    message: string;
  };
  risks: string[];
  previewHealth: {
    ok: boolean;
    status: string;
    diagnostics: string[];
    nextAction: string;
  };
  appliedRules: Array<{
    id: string;
    status: string;
    evidence: Record<string, unknown>;
    rule: {
      id: string;
      title: string;
      ruleText: string;
      targetScope: string;
      targetIdentifier: string | null;
    } | null;
  }>;
  events: RunEventData[];
};

type CorrectionData = {
  id: string;
  sessionId: string;
  runId: string | null;
  authorUserId: string | null;
  targetScope: "whole_prototype" | "route" | "component" | "file";
  targetIdentifier: string | null;
  correctionType: string;
  correctionText: string;
  beforeContext: string | null;
  afterContext: string | null;
  createdAt: string;
};

type LearnedRuleData = {
  id: string;
  status: "proposed" | "active" | "rejected" | "archived";
  targetScope: string;
  targetIdentifier: string | null;
  title: string;
  ruleText: string;
  correctionId: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type PreviewHealthData = {
  runId?: string;
  ok: boolean;
  status: string;
  origin: string | null;
  route: string | null;
  expectedOrigin: string | null;
  expectedRoute: string | null;
  httpStatus?: number;
  diagnostics: string[];
  nextAction: string;
};

const prototypeCards: PrototypeCardData[] = [
  {
    id: "demo-checkout-upsell",
    files: 5,
    added: 382,
    removed: 0,
    title: "Patrimony",
    branch: "prototype/patrimony",
    status: "Ready",
    owner: "LL",
    time: "1mo",
    fit: "94%",
    learned: "Pricing card spacing",
    notes: "Demo sample: opens the default production page for the Patrimony flow.",
    preview: DEFAULT_PROTOTYPE_PREVIEW_PATH,
    routePath: DEFAULT_PROTOTYPE_PREVIEW_PATH,
    routeSlug: "patrimony",
    sessionStatus: "new_ready",
  },
  {
    id: "demo-settings-empty",
    files: 3,
    added: 146,
    removed: 12,
    title: "Settings Empty State",
    branch: "prototype/settings-empty",
    status: "Draft",
    owner: "CP",
    time: "3w",
    fit: "88%",
    learned: "Empty-state hierarchy",
    notes: "Demo sample: clarifies the first-run state for teams with no connected repo.",
    preview: "settings",
    routePath: "/prototype/settings-empty",
    routeSlug: "settings-empty",
    sessionStatus: "session_created",
  },
  {
    id: "demo-handoff-summary",
    files: 4,
    added: 125,
    removed: 24,
    title: "Designer Handoff Summary",
    branch: "prototype/handoff-summary",
    status: "Review",
    owner: "NA",
    time: "2w",
    fit: "91%",
    learned: "Corrected badge style",
    notes: "Demo sample: summarizes intent, touched components, decisions, and review risks.",
    preview: "handoff",
    routePath: "/prototype/handoff-summary",
    routeSlug: "handoff-summary",
    sessionStatus: "processing",
  },
];

const MOCK_SESSIONS_STORAGE_KEY = "archetype:test-mode:sessions";
const MOCK_MESSAGES_STORAGE_PREFIX = "archetype:test-mode:messages:";

const MOCK_WORKSPACE: WorkspaceSummary = {
  id: "mock-workspace",
  name: "Archetype Test Workspace",
  repoName: "mock-frontend",
  prototypeRoot: "/mock/prototypes",
  status: "ready",
};

const workspaceTabs = [
  "Setup",
  "Preview",
  "Desktop",
  "Changes",
  "Logs",
] as const;

const validationItems = [
  "Mapped billing route and plan card components",
  "Reused existing Button, Badge, and Card primitives",
  "Kept checkout copy within current page rhythm",
  "No new color tokens introduced",
];

const diffFiles: Array<HandoffFileData & { rows: CodeDiffRow[] }> = [
  {
    file: "app/billing/checkout/page.tsx",
    added: 126,
    removed: 4,
    rows: rowsFromInlineLines([
      " const currentPlan = getActivePlan(account)",
      "+const upsellPlan = getPlanBySlug('team-plus')",
      "-<PlanComparison selectedPlan={currentPlan} />",
      "+<PlanComparison compact selectedPlan={currentPlan} />",
      "+<Button size=\"sm\">Add team seats</Button>",
    ]),
  },
  {
    file: "components/billing/plan-card.tsx",
    added: 42,
    removed: 3,
    rows: rowsFromInlineLines([
      " export function PlanCard({ plan, learnedRules }) {",
      "+  const compact = learnedRules.includes('compact-billing-card')",
      "+  const variant = compact ? 'compact' : 'default'",
      "-  return <Card className=\"gap-5 rounded-xl border-border bg-card\">",
      "+  return <Card className=\"gap-3 rounded-lg border-border bg-card\">",
    ]),
  },
  {
    file: ".codex/living-system.json",
    added: 1,
    removed: 0,
    rows: rowsFromInlineLines([
      "+\"compact-billing-card\": \"Use tight billing card spacing before promoting checkout CTAs\"",
    ]),
  },
];

const baseLogs = [
  [
    "14:47:39.102",
    "system",
    "Demo sample loaded prototype branch prototype/checkout-upsell",
  ],
  [
    "14:47:39.247",
    "analysis",
    "Resolved billing route, shared plan card, and checkout CTA pattern",
  ],
  ["14:47:40.003", "agent", "Demo sample generated checkout preview"],
  ["14:47:40.219", "validation", "Demo fit score shown for narrative only"],
];

const learnedLogs = [
  [
    "14:48:12.406",
    "designer",
    "Demo correction accepted: compact billing cards and quieter CTA",
  ],
  ["14:48:12.612", "living-system", "Demo rule proposal compact-billing-card"],
  ["14:48:13.081", "agent", "Demo preview regenerated with correction"],
  ["14:48:13.304", "validation", "Demo fit score updated for narrative only"],
];
type WorkspaceTab = (typeof workspaceTabs)[number];

export type InitialWorkspaceState = {
  learned: boolean;
  prototype: "checkout" | null;
  tab: WorkspaceTab;
};

function prototypeUrl({
  sessionId,
  tab = "Preview",
  learned = false,
}: {
  sessionId?: string;
  tab?: WorkspaceTab;
  learned?: boolean;
} = {}) {
  const params = new URLSearchParams({
    tab: tab.toLowerCase(),
  });

  if (learned) {
    params.set("learned", "1");
  }

  const path = sessionId ? `/detail/${sessionId}` : "/detail";

  return `${path}?${params.toString()}`;
}

function syncWorkspaceUrl({
  sessionId,
  tab = "Preview",
  learned = false,
}: {
  sessionId?: string;
  tab?: WorkspaceTab;
  learned?: boolean;
}) {
  if (typeof window !== "undefined") {
    window.history.pushState(
      null,
      "",
      prototypeUrl({ sessionId, tab, learned }),
    );
  }
}

function formatSessionTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function mapSessionStatus(status: string): PrototypeCardData["status"] {
  if (status === "current_ready" || status === "new_ready") {
    return "Ready";
  }

  if (status === "error") {
    return "Review";
  }

  return "Draft";
}

function slugifySessionTitle(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "mock-session"
  );
}

function deriveSessionTitle(brief: string) {
  const firstLine = brief
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean);

  if (!firstLine) {
    return "Untitled prototype";
  }

  if (firstLine.length <= 64) {
    return firstLine;
  }

  const clipped = firstLine.slice(0, 64);
  const lastSpace = clipped.lastIndexOf(" ");

  return `${(lastSpace > 24 ? clipped.slice(0, lastSpace) : clipped).trim()}...`;
}

function createLocalSessionSummary(title: string): CreateSessionResponse {
  const now = new Date().toISOString();
  const slug = slugifySessionTitle(title);

  return {
    id: `demo-${slug}-${Date.now().toString(36)}`,
    title,
    routeSlug: slug,
    routePath: `/prototype/${slug}`,
    status: "session_created",
    createdAt: now,
    updatedAt: now,
    items: [],
  };
}

function getPrototypeItemUrl(
  routePath: string,
  kind: PrototypeItemSummary["kind"],
) {
  if (routePath.startsWith("/prototype/")) {
    return `${routePath}/${kind}`;
  }

  return routePath;
}

function normalizePreviewAddress(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("/")) {
    return `${PROTOTYPE_PREVIEW_ORIGIN}${trimmedValue}`;
  }

  if (/^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?(\/|$)/i.test(trimmedValue)) {
    return `http://${trimmedValue}`;
  }

  return `${PROTOTYPE_PREVIEW_ORIGIN}/${trimmedValue.replace(/^\/+/, "")}`;
}

function parsePreviewUrl(value: string | null) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function normalizePreviewOrigin(value: string | null | undefined) {
  const parsedUrl = value ? parsePreviewUrl(value) : null;

  return parsedUrl?.origin ?? value?.replace(/\/+$/, "") ?? null;
}

function normalizeExpectedPreviewRoute(value: string | null | undefined) {
  if (!value?.startsWith("/")) {
    return null;
  }

  return value.replace(/\/+$/, "") || "/";
}

function previewRouteMatches(route: string, expectedRoute: string | null) {
  if (!expectedRoute) {
    return true;
  }

  return route === expectedRoute || route.startsWith(`${expectedRoute}/`);
}

function createPreviewDiagnostic({
  diagnostics,
  expectedOrigin,
  expectedRoute,
  nextAction,
  previewUrl,
  status,
}: {
  diagnostics: string[];
  expectedOrigin: string | null;
  expectedRoute: string | null;
  nextAction: string;
  previewUrl: string | null;
  status: string;
}): PreviewHealthData {
  const parsedUrl = parsePreviewUrl(previewUrl);

  return {
    ok: false,
    status,
    origin: parsedUrl?.origin ?? null,
    route: parsedUrl?.pathname ?? previewUrl,
    expectedOrigin,
    expectedRoute,
    diagnostics,
    nextAction,
  };
}

function formatPreviewHealthStatus(status: string | null | undefined) {
  if (!status) {
    return "Unknown";
  }

  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function validatePreviewLocally(
  previewUrl: string,
  expectedOrigin: string | null,
  expectedRoute: string | null,
) {
  const parsedUrl = parsePreviewUrl(previewUrl);

  if (!parsedUrl || !["http:", "https:"].includes(parsedUrl.protocol)) {
    return createPreviewDiagnostic({
      previewUrl,
      expectedOrigin,
      expectedRoute,
      status: "invalid_preview_url",
      diagnostics: ["Preview URL is not an absolute HTTP URL."],
      nextAction: "Update preview origin or regenerate the run.",
    });
  }

  if (expectedOrigin && parsedUrl.origin !== expectedOrigin) {
    return createPreviewDiagnostic({
      previewUrl,
      expectedOrigin,
      expectedRoute,
      status: "wrong_origin",
      diagnostics: [
        `Preview origin ${parsedUrl.origin} does not match ${expectedOrigin}.`,
      ],
      nextAction: "Update env or open the configured preview app.",
    });
  }

  if (!previewRouteMatches(parsedUrl.pathname, expectedRoute)) {
    return createPreviewDiagnostic({
      previewUrl,
      expectedOrigin,
      expectedRoute,
      status: "wrong_route",
      diagnostics: [
        `Preview route ${parsedUrl.pathname} does not match ${expectedRoute}.`,
      ],
      nextAction: "Regenerate this preview or open the expected route.",
    });
  }

  return null;
}

function readIframeLocation(iframe: HTMLIFrameElement | null) {
  try {
    return iframe?.contentWindow?.location.href ?? null;
  } catch {
    return null;
  }
}

function defaultMockSessions(): SessionSummary[] {
  return prototypeCards.map((card, index) => {
    const day = String(27 - index).padStart(2, "0");

    return {
      id: card.id.replace(/^demo-/, "mock-"),
      title: card.title,
      routeSlug: card.routeSlug,
      routePath: card.routePath,
      status: card.sessionStatus,
      createdAt: `2026-06-${day}T09:00:00.000Z`,
      updatedAt: `2026-06-${day}T10:30:00.000Z`,
    };
  });
}

function readStoredMockSessions() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const value = window.localStorage.getItem(MOCK_SESSIONS_STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return (parsed as SessionSummary[]).map((session) => {
      if (session.id !== "mock-checkout-upsell") {
        return session;
      }

      return {
        ...session,
        title: "Patrimony",
        routeSlug: "patrimony",
        routePath: DEFAULT_PROTOTYPE_PREVIEW_PATH,
      };
    });
  } catch {
    return [];
  }
}

function writeStoredMockSessions(sessions: SessionSummary[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    MOCK_SESSIONS_STORAGE_KEY,
    JSON.stringify(sessions),
  );
}

function getMockSessions() {
  const storedSessions = readStoredMockSessions();
  const storedIds = new Set(storedSessions.map((session) => session.id));
  const defaults = defaultMockSessions().filter(
    (session) => !storedIds.has(session.id),
  );

  return [...storedSessions, ...defaults];
}

function persistMockSession(session: SessionSummary) {
  const sessions = readStoredMockSessions();
  const nextSessions = [
    session,
    ...sessions.filter((item) => item.id !== session.id),
  ];

  writeStoredMockSessions(nextSessions);
}

function getMockSession(sessionId: string) {
  const session = getMockSessions().find((item) => item.id === sessionId);

  if (session) {
    return session;
  }

  if (sessionId === "mock-checkout-upsell") {
    return defaultMockSessions()[0];
  }

  return undefined;
}

function mockMessagesStorageKey(sessionId: string) {
  return `${MOCK_MESSAGES_STORAGE_PREFIX}${sessionId}`;
}

function defaultMockMessages(session: SessionSummary): ChatMessageData[] {
  return [
    {
      id: `${session.id}-mock-user-1`,
      role: "user",
      content: `Demo sample brief: ${session.title}`,
      createdAt: session.createdAt,
    },
    {
      id: `${session.id}-mock-assistant-1`,
      role: "assistant",
      content: `Mock mode generated a prototype direction for "${session.title}" using local frontend data.`,
      createdAt: session.updatedAt,
    },
  ];
}

function readMockMessages(sessionId: string) {
  const session = getMockSession(sessionId);

  if (!session) {
    return [];
  }

  if (typeof window === "undefined") {
    return defaultMockMessages(session);
  }

  try {
    const value = window.localStorage.getItem(mockMessagesStorageKey(sessionId));
    const parsed = value ? JSON.parse(value) : null;

    return Array.isArray(parsed)
      ? (parsed as ChatMessageData[])
      : defaultMockMessages(session);
  } catch {
    return defaultMockMessages(session);
  }
}

function writeMockMessages(sessionId: string, messages: ChatMessageData[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    mockMessagesStorageKey(sessionId),
    JSON.stringify(messages),
  );
}

async function apiFetch(path: string, init: RequestInit = {}) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: init.headers,
  });
}

async function fetchCurrentActor() {
  const response = await apiFetch("/auth/me", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Auth request failed with ${response.status}`);
  }

  return (await response.json()) as AuthPayload;
}

async function loginPrivateBeta(email: string, passcode: string) {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, passcode }),
  });

  if (!response.ok) {
    throw new Error("Invalid private beta credentials.");
  }

  return (await response.json()) as AuthPayload;
}

async function fetchWorkspaceSummary() {
  if (TEST_MODE) {
    return MOCK_WORKSPACE;
  }

  const response = await apiFetch("/workspace", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Workspace request failed with ${response.status}`);
  }

  return (await response.json()) as WorkspaceSummary;
}

async function fetchRepoConnection() {
  if (TEST_MODE) {
    return {
      id: "mock-repo",
      repoFullName: "mock/mock-frontend",
      branch: "main",
      currentCommitSha: "demo",
      prototypeRoot: "/mock/prototypes",
      previewOrigin: PROTOTYPE_PREVIEW_ORIGIN,
      status: "ready",
      lastError: null,
    } satisfies RepoConnectionData;
  }

  const response = await apiFetch("/repo-connections/current", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Repo connection request failed with ${response.status}`);
  }

  return (await response.json()) as RepoConnectionData;
}

async function fetchProjectGuide() {
  if (TEST_MODE) {
    return {
      guide: {
        id: "mock-guide",
        commitSha: "demo",
        generatedAt: new Date().toISOString(),
        stale: false,
        content: {
          summary: {
            routeCount: 12,
            componentCount: 34,
            primitiveCount: 8,
            scriptCount: 4,
            styleSignalCount: 3,
            envVarCount: 2,
          },
          routes: [{ file: "app/patrimony/page.tsx", routePath: "/patrimony" }],
          components: [{ file: "components/ui/button.tsx", label: "button" }],
          primitives: [{ file: "components/ui/card.tsx", label: "card" }],
          packageScripts: { build: "next build", lint: "eslint" },
          styling: [{ file: "app/globals.css", label: "globals" }],
          environment: [
            {
              name: "DATABASE_URL",
              required: true,
              public: false,
              reason: "Required by Prisma schema",
              sources: [{ file: "prisma/schema.prisma", label: "schema" }],
            },
            {
              name: "NEXTAUTH_SECRET",
              required: true,
              public: false,
              reason: "Referenced by application code",
              sources: [{ file: "app/api/auth/[...nextauth]/route.ts" }],
            },
          ],
        },
        evidence: {},
        unsupportedPatterns: [],
      },
    } satisfies ProjectGuideData;
  }

  const response = await apiFetch("/project-guide/current", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Project guide request failed with ${response.status}`);
  }

  return (await response.json()) as ProjectGuideData;
}

async function saveRepoEnvironment(variables: SaveRepoEnvironmentInput[]) {
  if (TEST_MODE) {
    return {
      path: "/mock/.env.local",
      variableCount: variables.length,
      keys: variables.map((variable) => variable.key),
      target: "development",
      updatedAt: new Date().toISOString(),
    } satisfies SaveRepoEnvironmentResponse;
  }

  const response = await apiFetch("/repo-connections/current/env", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`Environment save failed with ${response.status}`);
  }

  return (await response.json()) as SaveRepoEnvironmentResponse;
}

async function connectRepoAndScan(input: RepoConnectionInput) {
  const connectionResponse = await apiFetch("/repo-connections", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  if (!connectionResponse.ok) {
    const errorText = await connectionResponse.text().catch(() => "");

    throw new Error(errorText || `Repo connection failed with ${connectionResponse.status}`);
  }

  const connection = (await connectionResponse.json()) as RepoConnectionData;
  const scanResponse = await apiFetch("/repo-connections/current/scan", {
    method: "POST",
  });

  if (!scanResponse.ok) {
    const errorText = await scanResponse.text().catch(() => "");

    throw new Error(errorText || `Repo scan failed with ${scanResponse.status}`);
  }

  const guide = (await scanResponse.json()) as ProjectGuideData;

  return {
    connection,
    guide,
  };
}

async function scanCurrentRepo() {
  const response = await apiFetch("/repo-connections/current/scan", {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Repo scan failed with ${response.status}`);
  }

  return (await response.json()) as ProjectGuideData;
}

async function fetchSessionSummaries() {
  if (TEST_MODE) {
    return getMockSessions();
  }

  const response = await apiFetch("/sessions", {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Sessions request failed with ${response.status}`);
  }

  const payload = (await response.json()) as SessionListResponse;

  return payload.items;
}

function sessionToPrototypeCard(session: SessionSummary): PrototypeCardData {
  return {
    id: session.id,
    files: 0,
    added: 0,
    removed: 0,
    title: session.title,
    branch: `prototype/${session.routeSlug}`,
    status: mapSessionStatus(session.status),
    owner: "AI",
    time: formatSessionTime(session.updatedAt || session.createdAt),
    fit: "--",
    learned: "Project guide inferred",
    notes: `Session route: ${session.routePath}`,
    preview: session.routeSlug,
    routePath: session.routePath,
    routeSlug: session.routeSlug,
    sessionStatus: session.status,
  };
}

function applySessionDetailToCard(
  card: PrototypeCardData,
  detail: SessionDetailResponse,
): PrototypeCardData {
  const newPreview = detail.items.find((item) => item.kind === "new")?.url;
  const currentPreview = detail.items.find(
    (item) => item.kind === "current",
  )?.url;
  const runPreview =
    detail.lastSuccessfulRun?.previewUrl ?? detail.latestRun?.previewUrl;

  return {
    ...card,
    title: detail.title,
    status: mapSessionStatus(detail.status),
    notes: newPreview
      ? `New preview: ${newPreview}`
      : currentPreview
        ? `Current preview: ${currentPreview}`
        : `Session route: ${detail.routePath}`,
    preview: runPreview ?? newPreview ?? currentPreview ?? card.preview,
    routePath: detail.routePath,
    sessionStatus: detail.status,
    latestRunId: detail.latestRun?.id ?? card.latestRunId ?? null,
    lastSuccessfulRunId:
      detail.lastSuccessfulRun?.id ?? card.lastSuccessfulRunId ?? null,
  };
}

function sessionDetailToPrototypeCard(
  detail: SessionDetailResponse,
): PrototypeCardData {
  const routeSlug =
    detail.routePath.split("/").filter(Boolean).at(-1) ?? detail.id;

  return applySessionDetailToCard(
    {
      id: detail.id,
      files: 0,
      added: 0,
      removed: 0,
      title: detail.title,
      branch: `prototype/${routeSlug}`,
      status: mapSessionStatus(detail.status),
      owner: "AI",
      time: "Just now",
      fit: "--",
      learned: "Project guide inferred",
      notes: `Session route: ${detail.routePath}`,
      preview: routeSlug,
      routePath: detail.routePath,
      routeSlug,
      sessionStatus: detail.status,
      latestRunId: detail.latestRun?.id ?? null,
      lastSuccessfulRunId: detail.lastSuccessfulRun?.id ?? null,
    },
    detail,
  );
}

function isBackendSession(card: PrototypeCardData) {
  return !card.id.startsWith("demo-");
}

function isDemoPrototypeCard(card: PrototypeCardData) {
  return card.id.startsWith("demo-") || card.id.startsWith("mock-");
}

async function fetchSessionDetail(sessionId: string) {
  if (TEST_MODE) {
    const session = getMockSession(sessionId);

    if (!session) {
      throw new Error(`Mock session ${sessionId} was not found`);
    }

    return {
      id: session.id,
      title: session.title,
      routePath: session.routePath,
      status: session.status,
      items: [
        {
          kind: "current",
          url: getPrototypeItemUrl(session.routePath, "current"),
        },
        {
          kind: "new",
          url: getPrototypeItemUrl(session.routePath, "new"),
        },
      ],
    } satisfies SessionDetailResponse;
  }

  const response = await apiFetch(`/sessions/${sessionId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Session detail request failed with ${response.status}`);
  }

  return (await response.json()) as SessionDetailResponse;
}

async function fetchSessionMessages(sessionId: string) {
  if (TEST_MODE) {
    return readMockMessages(sessionId);
  }

  const response = await apiFetch(`/sessions/${sessionId}/messages`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Messages request failed with ${response.status}`);
  }

  const payload = (await response.json()) as SessionMessagesResponse;

  return payload.items;
}

async function submitSessionPrompt(
  sessionId: string,
  content: string,
  images: File[] = [],
) {
  if (TEST_MODE) {
    const now = new Date().toISOString();
    const session = getMockSession(sessionId);

    if (!session) {
      throw new Error(`Mock session ${sessionId} was not found`);
    }

    const userMessage: ChatMessageData = {
      id: `mock-user-${sessionId}-${Date.now()}`,
      role: "user",
      content,
      createdAt: now,
    };
    const assistantMessage: ChatMessageData = {
      id: `mock-assistant-${sessionId}-${Date.now()}`,
      role: "assistant",
      content: `Demo mode response ready. A real run would generate a refreshed prototype from this brief${images.length ? ` with ${images.length} image reference${images.length === 1 ? "" : "s"}` : ""} and keep it inside ${session.routePath}.`,
      createdAt: now,
    };
    const updatedSession = {
      ...session,
      status: "new_ready",
      updatedAt: now,
    };

    persistMockSession(updatedSession);
    writeMockMessages(sessionId, [
      ...readMockMessages(sessionId),
      userMessage,
      assistantMessage,
    ]);

    return assistantMessage;
  }

  const body = new FormData();
  body.set("content", content);
  images.forEach((image) => {
    body.append("images", image);
  });

  const response = await apiFetch(`/sessions/${sessionId}/prompts`, {
    method: "POST",
    body,
  });

  if (!response.ok) {
    throw new Error(`Submit prompt failed with ${response.status}`);
  }

  return (await response.json()) as {
    accepted: true;
    sessionId: string;
    runId: string;
    status: string;
  };
}

async function fetchRunHandoff(runId: string) {
  const response = await apiFetch(`/runs/${runId}/handoff`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Handoff request failed with ${response.status}`);
  }

  return (await response.json()) as HandoffData;
}

async function fetchRunEvents(runId: string) {
  const response = await apiFetch(`/runs/${runId}/events`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Run events request failed with ${response.status}`);
  }

  return ((await response.json()) as { items: RunEventData[] }).items;
}

async function cancelRun(runId: string) {
  const response = await apiFetch(`/runs/${runId}/cancel`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Cancel run failed with ${response.status}`);
  }

  return (await response.json()) as RunSummary;
}

async function retryRun(runId: string) {
  const response = await apiFetch(`/runs/${runId}/retry`, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Retry run failed with ${response.status}`);
  }

  return (await response.json()) as RunSummary;
}

async function fetchPreviewHealth(
  previewUrl: string,
  expectedRoute: string | null,
) {
  if (TEST_MODE) {
    const parsedUrl = parsePreviewUrl(previewUrl);

    return {
      ok: true,
      status: "demo_health",
      origin: parsedUrl?.origin ?? null,
      route: parsedUrl?.pathname ?? null,
      expectedOrigin: normalizePreviewOrigin(PROTOTYPE_PREVIEW_ORIGIN),
      expectedRoute,
      diagnostics: ["Demo mode skipped backend preview health."],
      nextAction: "Inspect preview",
    } satisfies PreviewHealthData;
  }

  const response = await apiFetch("/preview-health", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      previewUrl,
      ...(expectedRoute ? { expectedRoute } : {}),
    }),
  });

  if (!response.ok) {
    throw new Error(`Preview health request failed with ${response.status}`);
  }

  return (await response.json()) as PreviewHealthData;
}

async function fetchRunPreviewHealth(runId: string) {
  const response = await apiFetch(`/runs/${runId}/preview-health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Run preview health request failed with ${response.status}`);
  }

  return (await response.json()) as PreviewHealthData;
}

async function fetchSessionCorrections(sessionId: string) {
  const response = await apiFetch(`/sessions/${sessionId}/corrections`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Corrections request failed with ${response.status}`);
  }

  return ((await response.json()) as { items: CorrectionData[] }).items;
}

async function createSessionCorrection({
  afterContext,
  beforeContext,
  correctionText,
  runId,
  sessionId,
  targetIdentifier,
  targetScope,
}: {
  afterContext?: string;
  beforeContext?: string;
  correctionText: string;
  runId?: string | null;
  sessionId: string;
  targetIdentifier?: string;
  targetScope: "whole_prototype" | "route" | "component" | "file";
}) {
  const response = await apiFetch(`/sessions/${sessionId}/corrections`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      afterContext,
      beforeContext,
      correctionText,
      runId: runId ?? undefined,
      targetIdentifier,
      targetScope,
    }),
  });

  if (!response.ok) {
    throw new Error(`Correction request failed with ${response.status}`);
  }

  return (await response.json()) as CorrectionData;
}

async function proposeLearnedRule(correctionId: string) {
  const response = await apiFetch(`/corrections/${correctionId}/propose-rule`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    throw new Error(`Rule proposal failed with ${response.status}`);
  }

  return (await response.json()) as LearnedRuleData;
}

async function updateLearnedRule(
  ruleId: string,
  patch: Partial<Pick<LearnedRuleData, "status" | "title" | "ruleText">>,
) {
  const response = await apiFetch(`/learned-rules/${ruleId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error(`Rule update failed with ${response.status}`);
  }

  return (await response.json()) as LearnedRuleData;
}

async function fetchLearnedRules(status?: LearnedRuleData["status"]) {
  const suffix = status ? `?status=${status}` : "";
  const response = await apiFetch(`/learned-rules${suffix}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Learned rules request failed with ${response.status}`);
  }

  return ((await response.json()) as { items: LearnedRuleData[] }).items;
}

async function createSession(title: string) {
  if (TEST_MODE) {
    const session = {
      ...createLocalSessionSummary(title),
      id: `mock-${slugifySessionTitle(title)}-${Date.now().toString(36)}`,
    } satisfies CreateSessionResponse;

    persistMockSession(session);

    return session;
  }

  const response = await apiFetch("/sessions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });

  if (!response.ok) {
    throw new Error(`Create session failed with ${response.status}`);
  }

  return (await response.json()) as CreateSessionResponse;
}

function HeroLogo() {
  return (
    <Image
      src="/logo_archetype.svg"
      alt="Archetype logo"
      width={76}
      height={76}
      priority
      className="size-16 shrink-0 drop-shadow-[0_22px_44px_oklch(0.5_0.24_269_/_0.18)] sm:size-[76px]"
    />
  );
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const [actor, setActor] = useState<AuthPayload | null>(null);
  const [email, setEmail] = useState("founder@archetype.dev");
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(!TEST_MODE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (TEST_MODE) {
      return;
    }

    let cancelled = false;

    void fetchCurrentActor()
      .then((payload) => {
        if (!cancelled) {
          setActor(payload);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setActor(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      setActor(await loginPrivateBeta(email, passcode));
      setPasscode("");
    } catch (loginError) {
      setError(
        loginError instanceof Error
          ? loginError.message
          : "Private beta login failed.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (TEST_MODE || actor) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <main className="grid h-screen place-items-center bg-card text-sm text-muted-foreground">
        Checking private beta session...
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[oklch(0.965_0_0)] px-4 text-foreground">
      <form
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-5 shadow-sm"
        onSubmit={handleLogin}
      >
        <div className="flex items-center gap-3">
          <HeroLogo />
          <div>
            <h1 className="text-base font-semibold">Private beta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your Archetype workspace.
            </p>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <label className="block text-sm font-medium">
            Email
            <Input
              className="mt-1.5 h-10"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="block text-sm font-medium">
            Passcode
            <Input
              className="mt-1.5 h-10"
              type="password"
              autoComplete="current-password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
            />
          </label>
        </div>
        {error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}
        <Button
          className="mt-5 w-full rounded-full"
          disabled={submitting || !email.trim() || !passcode.trim()}
          type="submit"
        >
          {submitting ? "Signing in" : "Continue"}
        </Button>
      </form>
    </main>
  );
}

function SidebarItem({
  icon: Icon,
  label,
  active = false,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  active?: boolean;
}) {
  return (
    <Button
      variant={active ? "secondary" : "ghost"}
      className={cn(
        "h-9 w-full justify-start gap-2 rounded-xl px-3 text-[0.92rem]",
        active && "bg-accent text-accent-foreground",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Button>
  );
}

function WorkspaceSidebarContent({
  headerAction,
  onRecentOpenChange,
  onSearchChange,
  onSelectPrototype,
  projectGuide,
  recentOpen,
  recentSessionCards,
  searchQuery,
  showProjectGuide = false,
  workspaceName,
}: {
  headerAction?: React.ReactNode;
  onRecentOpenChange: (value: boolean) => void;
  onSearchChange: (value: string) => void;
  onSelectPrototype: (card: PrototypeCardData) => void;
  projectGuide?: ProjectGuideData | null;
  recentOpen: boolean;
  recentSessionCards: PrototypeCardData[];
  searchQuery: string;
  showProjectGuide?: boolean;
  workspaceName: string;
}) {
  const visibleRecentSessionCards = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return recentSessionCards;
    }

    return recentSessionCards.filter((card) =>
      card.title.toLowerCase().includes(normalizedQuery),
    );
  }, [recentSessionCards, searchQuery]);

  return (
    <>
      <div className="flex items-center justify-between px-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar className="size-7 border border-border">
            <AvatarFallback className="bg-[oklch(0.86_0.045_255)] text-xs font-semibold text-[oklch(0.28_0.08_270)]">
              A
            </AvatarFallback>
          </Avatar>
          <span className="truncate text-sm font-semibold">
            {workspaceName}
          </span>
        </div>
        {headerAction}
      </div>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="h-9 rounded-full border-transparent bg-background/65 pl-9 shadow-none"
          placeholder="Search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <nav className="mt-3 space-y-1">
        <SidebarItem icon={LayoutDashboard} label="Prototypes" active />
      </nav>

      <button
        className="mt-5 flex w-full items-center justify-between px-2 text-sm font-medium text-muted-foreground"
        onClick={() => onRecentOpenChange(!recentOpen)}
        type="button"
      >
        Recent
        <ChevronDown
          className={cn(
            "size-4 transition-transform",
            !recentOpen && "-rotate-90",
          )}
        />
      </button>
      {recentOpen ? (
        <div className="mt-2 space-y-1">
          {visibleRecentSessionCards.length > 0 ? (
            visibleRecentSessionCards.map((card) => (
              <Button
                key={card.id}
                variant="ghost"
                className="h-8 w-full justify-start gap-2 truncate rounded-xl px-3 text-[0.85rem]"
                onClick={() => onSelectPrototype(card)}
                type="button"
              >
                <span className="size-2 rounded-full bg-[var(--codex-blue)]" />
                <span className="truncate">{card.title}</span>
              </Button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              {searchQuery.trim() ? "No matching sessions." : "No sessions yet."}
            </p>
          )}
        </div>
      ) : null}

      {showProjectGuide ? (
        <div className="mt-auto rounded-2xl bg-background/45 p-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <BadgeCheck className="size-3.5 text-[var(--codex-purple)]" />
            {projectGuide ? "Project guide ready" : "Project guide pending"}
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {projectGuide
              ? "Inferred from the connected repo, no design-system cleanup required."
              : "Connect and scan a repo to replace demo guide samples."}
          </p>
        </div>
      ) : null}
    </>
  );
}

function GithubMark({ className }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82A7.52 7.52 0 0 1 8 3.87c.68 0 1.36.09 2 .26 1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.06-1.86 3.75-3.64 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}

function PrototypeBlank({ card }: { card: PrototypeCardData }) {
  const demoCard = isDemoPrototypeCard(card);

  return (
    <div className="relative h-48 rounded-[1.35rem] border border-border/80 bg-card shadow-none sm:h-52">
      <div className="absolute left-6 top-5 text-sm font-semibold text-muted-foreground">
        {demoCard ? "Demo sample" : `${card.files} files`}
      </div>
      <div className="absolute right-6 top-5 flex items-center gap-2.5 text-sm font-semibold">
        {demoCard ? (
          <span className="text-muted-foreground">Static</span>
        ) : (
          <>
            <span className="font-mono text-emerald-600">+{card.added}</span>
            <span className="font-mono text-rose-500">-{card.removed}</span>
          </>
        )}
      </div>
      <Badge
        variant="secondary"
        className={cn(
          "absolute bottom-6 left-6 h-7 rounded-full px-3 text-xs font-medium",
          card.status === "Ready" && "bg-muted text-foreground hover:bg-muted",
          card.status === "Draft" &&
            "bg-[oklch(0.94_0.026_270)] text-muted-foreground hover:bg-[oklch(0.94_0.026_270)]",
          card.status === "Review" &&
            "bg-[oklch(0.9_0.075_274)] text-[oklch(0.32_0.13_270)] hover:bg-[oklch(0.9_0.075_274)]",
        )}
      >
        {card.status}
      </Badge>
    </div>
  );
}

function PrototypeCard({
  card,
  onSelect,
}: {
  card: PrototypeCardData;
  onSelect: (card: PrototypeCardData) => void;
}) {
  return (
    <button
      type="button"
      className="group space-y-3.5 text-left outline-none"
      onClick={() => onSelect(card)}
    >
      <div className="rounded-[1.45rem] transition-transform duration-200 ease-out group-hover:-translate-y-0.5 group-focus-visible:ring-3 group-focus-visible:ring-ring/40">
        <PrototypeBlank card={card} />
      </div>
      <div className="flex min-w-0 items-center gap-2.5 px-1">
        <Avatar className="size-9 border border-border">
          <AvatarImage src="" alt="" />
          <AvatarFallback className="bg-accent text-accent-foreground">
            {card.owner}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight">
            {card.title}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {isDemoPrototypeCard(card) ? "Demo data" : card.time}
          </p>
        </div>
      </div>
    </button>
  );
}

function DashboardView({
  creatingSession,
  onCreateSession,
  onPromptChange,
  onRepoConnected,
  onSelectPrototype,
  prompt,
  prototypeCards,
  projectGuide,
  repoConnection,
  workspace,
}: {
  creatingSession: boolean;
  onCreateSession: (images?: File[]) => void;
  onPromptChange: (value: string) => void;
  onRepoConnected: (payload: {
    connection: RepoConnectionData;
    guide: ProjectGuideData;
  }) => void;
  onSelectPrototype: (card: PrototypeCardData) => void;
  prompt: string;
  prototypeCards: PrototypeCardData[];
  projectGuide: ProjectGuideData | null;
  repoConnection: RepoConnectionData | null;
  workspace: WorkspaceSummary | null;
}) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [guideOpen, setGuideOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<DashboardSort>("lastEdited");
  const [viewMode, setViewMode] = useState<DashboardViewMode>("grid");
  const [repoForm, setRepoForm] = useState<RepoConnectionInput>({
    repoUrl: repoConnection?.repoFullName ?? "",
    branch: repoConnection?.branch ?? "main",
    prototypeRoot: repoConnection?.prototypeRoot ?? "src/app/(prototype)/prototype",
    previewOrigin: repoConnection?.previewOrigin ?? PROTOTYPE_PREVIEW_ORIGIN,
  });
  const [repoSaving, setRepoSaving] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);
  const selectedImagePreviews = useMemo(
    () =>
      selectedImages.map((image) => ({
        file: image,
        url: URL.createObjectURL(image),
      })),
    [selectedImages],
  );

  useEffect(() => {
    return () => {
      selectedImagePreviews.forEach((preview) => {
        URL.revokeObjectURL(preview.url);
      });
    };
  }, [selectedImagePreviews]);

  const visibleCards = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredCards = normalizedQuery
      ? prototypeCards.filter((card) =>
          [
            card.title,
            card.branch,
            card.notes,
            card.status,
            card.learned,
            card.routePath,
          ]
            .join(" ")
            .toLowerCase()
            .includes(normalizedQuery),
        )
      : prototypeCards;

    return [...filteredCards].sort((first, second) => {
      if (sortBy === "systemFit") {
        const firstFit = Number.parseInt(first.fit, 10) || 0;
        const secondFit = Number.parseInt(second.fit, 10) || 0;

        return secondFit - firstFit;
      }

      if (sortBy === "review") {
        return (
          Number(second.status === "Review") -
          Number(first.status === "Review")
        );
      }

      return 0;
    });
  }, [prototypeCards, searchQuery, sortBy]);

  const sortLabel =
    sortBy === "systemFit"
      ? "Highest system fit"
      : sortBy === "review"
        ? "Ready for review"
        : "Last edited";
  const guideSummary = projectGuide?.guide.content.summary;
  const guideSignals = projectGuide
    ? [
        {
          label: `${guideSummary?.routeCount ?? 0} routes mapped`,
          value: "routes",
        },
        {
          label: `${guideSummary?.componentCount ?? 0} components inferred`,
          value: "components",
        },
        {
          label: `${guideSummary?.primitiveCount ?? 0} UI primitives found`,
          value: "rules",
        },
        {
          label: `${guideSummary?.envVarCount ?? projectGuide.guide.content.environment?.length ?? 0} env vars mapped`,
          value: "environment",
        },
      ]
    : [];
  const hasConnectedRepo =
    repoConnection?.status === "ready" && Boolean(repoConnection.repoFullName);
  const selectedRepoName =
    repoConnection?.repoFullName ?? workspace?.repoName ?? "Connect repo";
  const guideStatus = projectGuide
    ? projectGuide.guide.stale
      ? "Project guide stale"
      : "Project guide ready"
    : repoConnection?.status === "ready"
      ? "Scan repo to generate guide"
      : "Connect GitHub repo";

  const applyBriefTemplate = (template: string) => {
    const nextPrompt = prompt.trim() ? `${prompt.trim()}\n\n${template}` : template;

    onPromptChange(nextPrompt);
    window.requestAnimationFrame(() => promptRef.current?.focus());
  };

  async function handleRepoSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (repoSaving) {
      return;
    }

    setRepoSaving(true);
    setRepoError(null);

    try {
      onRepoConnected(await connectRepoAndScan(repoForm));
    } catch (error) {
      setRepoError(
        error instanceof Error ? error.message : "Repo connection failed.",
      );
    } finally {
      setRepoSaving(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="relative min-h-full">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-8 lg:px-12">
          <section className="mx-auto flex min-h-[640px] w-full max-w-3xl flex-col items-center justify-center pb-8 pt-10 text-center lg:min-h-[690px]">
            <HeroLogo />
            <div className="mt-7 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {repoConnection?.status === "ready"
                  ? `${selectedRepoName} on ${repoConnection.branch}, ${repoConnection.currentCommitSha?.slice(0, 7) ?? "no commit"}`
                  : "Server-token GitHub repo, production components, learned patterns"}
              </p>
              <h2 className="text-3xl font-medium tracking-tight sm:text-5xl">
                Build with your real product
              </h2>
            </div>

            {SHOW_PROJECT_GUIDE_FEATURE ? (
              <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
                <div className="mt-7 flex w-full flex-col gap-3 rounded-2xl border border-[oklch(0.47_0.22_269_/_0.18)] bg-[oklch(0.9_0.075_274_/_0.78)] p-3 text-left text-sm font-medium text-accent-foreground sm:flex-row sm:items-center sm:rounded-full sm:p-2 sm:pl-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                    <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--codex-blue)] sm:mt-0" />
                    <span className="min-w-0 flex-1">
                      {guideStatus}: routes, components, and patterns inferred from
                      code.
                    </span>
                  </div>
                  <DialogTrigger asChild>
                    <Button className="rounded-full px-5" type="button">
                      View guide
                    </Button>
                  </DialogTrigger>
                </div>

              <DialogContent className="w-[min(calc(100%-2rem),56rem)] max-w-none gap-0 overflow-hidden bg-white p-0">
                <div className="border-b border-border/70 bg-white px-5 py-4 pr-12">
                  <DialogHeader className="gap-0">
                    <div className="flex items-start gap-3">
                      <GithubMark className="mt-1 size-6 shrink-0" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <DialogTitle className="text-base">
                            Connect GitHub repo
                          </DialogTitle>
                          {projectGuide ? (
                            <span className="rounded-full border border-border/70 bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                              Source backed
                            </span>
                          ) : null}
                        </div>
                        <DialogDescription className="mt-1 max-w-3xl">
                          {projectGuide
                            ? "Routes, reusable UI primitives, and setup requirements from the connected repo."
                            : "Connect a repo to replace this demo guide with source-backed evidence."}
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                </div>

                <div className="grid gap-4 bg-white px-5 py-4">
                  {guideSignals.length ? (
                    <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {guideSignals.map((signal) => (
                        <div
                          key={signal.value}
                          className="rounded-xl border border-border/70 bg-card px-3 py-3 shadow-[0_1px_0_oklch(1_0_0_/_0.72)_inset]"
                        >
                          <div className="flex items-center gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[oklch(0.94_0.04_274)] text-[var(--codex-purple)]">
                              <WandSparkles className="size-3.5" />
                            </span>
                            <div className="min-w-0 truncate text-sm font-medium">
                              {signal.label}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-muted-foreground">
                            Backed by file evidence
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {projectGuide ? (
                    <div className="grid gap-4 rounded-xl border border-border/70 bg-muted/30 p-3 text-sm lg:grid-cols-3">
                      <div>
                        <div className="font-medium">Guide state</div>
                        <div className="mt-2 space-y-1 text-muted-foreground">
                          <div>
                            Commit{" "}
                            <code className="text-foreground">
                              {projectGuide.guide.commitSha?.slice(0, 7) ?? "unknown"}
                            </code>
                          </div>
                          <div>
                            Generated{" "}
                            {new Date(projectGuide.guide.generatedAt).toLocaleString()}
                          </div>
                          <div>{projectGuide.guide.stale ? "Stale" : "Current"}</div>
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Route evidence</div>
                        <div className="mt-2 space-y-1">
                          {(projectGuide.guide.content.routes ?? [])
                            .slice(0, 4)
                            .map((route) => (
                              <div key={route.file} className="truncate text-muted-foreground">
                                {route.routePath ?? "/"}:{" "}
                                <code className="text-foreground">{route.file}</code>
                              </div>
                            ))}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Component evidence</div>
                        <div className="mt-2 space-y-1">
                          {(projectGuide.guide.content.components ?? [])
                            .slice(0, 4)
                            .map((component) => (
                              <div key={component.file} className="truncate text-muted-foreground">
                                <code className="text-foreground">{component.file}</code>
                              </div>
                            ))}
                          {projectGuide.guide.unsupportedPatterns.length ? (
                            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-800">
                              {projectGuide.guide.unsupportedPatterns[0]}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <form
                    className="grid gap-4 text-sm"
                    onSubmit={handleRepoSubmit}
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <label className="block font-medium">
                        Repo URL
                        <Input
                          className="mt-1.5 h-9"
                          placeholder="owner/repo or https://github.com/owner/repo"
                          value={repoForm.repoUrl}
                          onChange={(event) =>
                            setRepoForm((current) => ({
                              ...current,
                              repoUrl: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="block font-medium">
                        Branch
                        <Input
                          className="mt-1.5 h-9"
                          value={repoForm.branch}
                          onChange={(event) =>
                            setRepoForm((current) => ({
                              ...current,
                              branch: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="block font-medium">
                        Prototype root
                        <Input
                          className="mt-1.5 h-9"
                          value={repoForm.prototypeRoot}
                          onChange={(event) =>
                            setRepoForm((current) => ({
                              ...current,
                              prototypeRoot: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label className="block font-medium">
                        Preview origin
                        <Input
                          className="mt-1.5 h-9"
                          value={repoForm.previewOrigin}
                          onChange={(event) =>
                            setRepoForm((current) => ({
                              ...current,
                              previewOrigin: event.target.value,
                            }))
                          }
                        />
                      </label>
                    </div>
                    {repoError ? (
                      <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                        {repoError}
                      </div>
                    ) : null}
                    <DialogFooter className="border-t border-border/70 pt-3">
                      <DialogClose asChild>
                        <Button
                          variant="outline"
                          className="rounded-full"
                          type="button"
                        >
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button
                        className="rounded-full"
                        disabled={repoSaving || !repoForm.repoUrl.trim()}
                        type="submit"
                      >
                        {repoSaving ? "Connecting" : "Connect and scan"}
                      </Button>
                    </DialogFooter>
                  </form>
                </div>
              </DialogContent>
              </Dialog>
            ) : null}

            <Card className="mt-14 w-full rounded-[1.4rem] bg-card/95 p-0 shadow-[0_24px_70px_oklch(0.18_0.012_260_/_0.1)]">
              <CardContent className="p-0">
                <input
                  ref={imageInputRef}
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  multiple
                  tabIndex={-1}
                  onChange={(event) => {
                    setSelectedImages(
                      Array.from(event.target.files ?? []).slice(0, 5),
                    );
                    event.target.value = "";
                  }}
                />
                {selectedImagePreviews.length ? (
                  <div className="flex gap-3 overflow-x-auto px-5 pb-1 pt-5">
                    {selectedImagePreviews.map((preview, index) => (
                      <div
                        key={`${preview.file.name}-${preview.file.lastModified}-${index}`}
                        className="relative size-20 shrink-0 overflow-visible rounded-xl border border-border bg-muted"
                      >
                        <Image
                          src={preview.url}
                          alt={preview.file.name}
                          fill
                          unoptimized
                          sizes="80px"
                          className="rounded-xl object-cover"
                        />
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          className="absolute -right-2 -top-2 rounded-full bg-foreground text-background shadow-sm hover:bg-foreground/90 hover:text-background"
                          aria-label={`Remove ${preview.file.name}`}
                          onClick={() =>
                            setSelectedImages((current) =>
                              current.filter((image) => image !== preview.file),
                            )
                          }
                          type="button"
                        >
                          <X className="size-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <Textarea
                  ref={promptRef}
                  className={cn(
                    "min-h-36 resize-none rounded-t-[1.4rem] border-0 bg-transparent px-5 pb-5 text-base shadow-none focus-visible:ring-0",
                    selectedImagePreviews.length ? "pt-3" : "pt-5",
                  )}
                  placeholder="Write the PM brief: problem, target user flow, acceptance criteria, and the product area this should modify..."
                  value={prompt}
                  onChange={(event) => onPromptChange(event.target.value)}
                />
                <div className="flex flex-col gap-3 border-t border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Upload image"
                      disabled={creatingSession}
                      onClick={() => imageInputRef.current?.click()}
                      type="button"
                    >
                      <ImagePlus className="size-4" />
                    </Button>
                    {SHOW_REPO_SELECTOR ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1.5 rounded-full"
                            type="button"
                          >
                            <GithubMark className="size-4" />
                            <span className="max-w-40 truncate">
                              {selectedRepoName}
                            </span>
                            <ChevronDown className="size-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-72 p-0" align="start">
                          <div className="p-2">
                            <div className="px-2 py-1 text-sm font-medium text-muted-foreground">
                              Codebase
                            </div>
                            {hasConnectedRepo ? (
                              <DropdownMenuItem
                                className="gap-3 px-2 py-2 text-base"
                                onSelect={() => setGuideOpen(true)}
                              >
                                <GithubMark className="size-5" />
                                <span className="truncate">{selectedRepoName}</span>
                                <Check className="ml-auto size-4" />
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="gap-3 px-2 py-2 text-base"
                                onSelect={() => setGuideOpen(true)}
                              >
                                <GithubMark className="size-5" />
                                <span className="truncate">
                                  Connect to Github
                                </span>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="gap-3 px-2 py-2 text-base"
                              onSelect={() => setGuideOpen(true)}
                            >
                              <Plus className="size-5 text-muted-foreground" />
                              Add another repo
                            </DropdownMenuItem>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1.5 rounded-full"
                          type="button"
                        >
                          <MessageSquare className="size-4" />
                          PM brief
                          <ChevronDown className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onSelect={() =>
                            applyBriefTemplate(
                              "Problem: \nTarget user flow: \nAcceptance criteria: \nProduct area to modify: ",
                            )
                          }
                        >
                          PM brief
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            applyBriefTemplate(
                              "Bug: \nExpected behavior: \nActual behavior: \nAffected route or component: ",
                            )
                          }
                        >
                          Bug report
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onSelect={() =>
                            applyBriefTemplate(
                              "Experiment: \nAudience: \nSuccess metric: \nGuardrails: ",
                            )
                          }
                        >
                          Experiment
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      size="icon"
                      className="rounded-full"
                      disabled={creatingSession || !prompt.trim()}
                      aria-label="Generate prototype"
                      onClick={() => {
                        if (!prompt.trim()) {
                          return;
                        }

                        onCreateSession(selectedImages);
                        setSelectedImages([]);
                      }}
                    >
                      <ArrowUp className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {SHOW_PROJECT_GUIDE_FEATURE && guideSignals.length ? (
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {guideSignals.map((signal) => (
                  <Badge
                    key={signal.value}
                    variant="outline"
                    className="h-8 rounded-full bg-card/80 px-3 text-sm"
                  >
                    <WandSparkles className="size-3.5 text-[var(--codex-purple)]" />
                    {signal.label}
                  </Badge>
                ))}
              </div>
            ) : null}
          </section>

          <section className="mt-10">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-10 rounded-full bg-card pl-9"
                    placeholder="Search prototypes"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 rounded-full bg-card px-4"
                    >
                      {sortLabel}
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onSelect={() => setSortBy("lastEdited")}>
                      Last edited
                      {sortBy === "lastEdited" ? (
                        <Check className="ml-auto size-4" />
                      ) : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setSortBy("systemFit")}>
                      Highest system fit
                      {sortBy === "systemFit" ? (
                        <Check className="ml-auto size-4" />
                      ) : null}
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setSortBy("review")}>
                      Ready for review
                      {sortBy === "review" ? (
                        <Check className="ml-auto size-4" />
                      ) : null}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <Tabs
                  value={viewMode}
                  onValueChange={(value) =>
                    setViewMode(value as DashboardViewMode)
                  }
                >
                  <TabsList className="h-10 rounded-full bg-muted/80 p-1 group-data-horizontal/tabs:h-10">
                    <TabsTrigger
                      value="grid"
                      className="rounded-full px-3"
                      aria-label="Grid view"
                    >
                      <Grid2X2 className="size-4" />
                    </TabsTrigger>
                    <TabsTrigger
                      value="list"
                      className="rounded-full px-3"
                      aria-label="List view"
                    >
                      <List className="size-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div
              className={cn(
                "mt-6 gap-7 xl:gap-8",
                viewMode === "grid"
                  ? "grid lg:grid-cols-3"
                  : "flex flex-col gap-3",
              )}
            >
              {visibleCards.length > 0 ? (
                visibleCards.map((card) =>
                  viewMode === "grid" ? (
                  <PrototypeCard
                    card={card}
                    key={card.id}
                    onSelect={onSelectPrototype}
                  />
                  ) : (
                    <button
                      type="button"
                      key={card.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-border/80 bg-background/72 p-4 text-left transition-colors hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/40"
                      onClick={() => onSelectPrototype(card)}
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">
                          {card.title}
                        </div>
                        <div className="mt-1 truncate text-xs text-muted-foreground">
                          {card.notes}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {isDemoPrototypeCard(card) ? (
                          <Badge variant="secondary" className="rounded-full">
                            Demo data
                          </Badge>
                        ) : null}
                        <Badge variant="outline" className="rounded-full">
                          {card.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {card.time}
                        </span>
                      </div>
                    </button>
                  ),
                )
              ) : (
                <div className="flex min-h-40 flex-col items-center justify-center py-12 text-center lg:col-span-3">
                  <h3 className="text-sm font-medium">
                    {searchQuery.trim()
                      ? "No prototypes found"
                      : "No prototype sessions yet"}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {searchQuery.trim()
                      ? "Try a different search term."
                      : "Generate the first prompt to create a new session slug."}
                  </p>
                </div>
              )}
            </div>

            {SHOW_PROJECT_GUIDE_FEATURE && projectGuide ? (
              <div className="mt-5 rounded-2xl border border-border/80 bg-background/64 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-medium">Project guide signal</h3>
                    <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                      Source-backed guide data is available for prototype
                      context.
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="h-7 rounded-full bg-card px-3"
                  >
                    <Link2 className="size-3.5" />
                    {`${guideSummary?.primitiveCount ?? 0} primitives mapped`}
                  </Badge>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function WorkspaceSidebarOverlay({
  open,
  onClose,
  onRecentOpenChange,
  onSearchChange,
  onSelectPrototype,
  recentOpen,
  recentSessionCards,
  searchQuery,
  workspaceName,
}: {
  open: boolean;
  onClose: () => void;
  onRecentOpenChange: (value: boolean) => void;
  onSearchChange: (value: string) => void;
  onSelectPrototype: (card: PrototypeCardData) => void;
  recentOpen: boolean;
  recentSessionCards: PrototypeCardData[];
  searchQuery: string;
  workspaceName: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="absolute inset-x-0 bottom-0 top-14 z-40">
      <button
        aria-label="Close workspace sidebar"
        className="absolute inset-0 bg-foreground/10"
        onClick={onClose}
        type="button"
      />
      <aside className="absolute left-2 top-2 flex h-[calc(100%-1rem)] w-[min(414px,calc(100vw-1rem))] flex-col rounded-2xl border border-border bg-white p-3 text-sidebar-foreground shadow-[0_18px_55px_oklch(0.18_0.012_260_/_0.14)]">
        <WorkspaceSidebarContent
          onRecentOpenChange={onRecentOpenChange}
          onSearchChange={onSearchChange}
          onSelectPrototype={(card) => {
            onClose();
            onSelectPrototype(card);
          }}
          recentOpen={recentOpen}
          recentSessionCards={recentSessionCards}
          searchQuery={searchQuery}
          workspaceName={workspaceName}
        />
      </aside>
    </div>
  );
}

function DashboardSidebarOverlay({
  onRecentOpenChange,
  open,
  onClose,
  onSearchChange,
  recentSessionCards,
  recentOpen,
  searchQuery,
  onSelectPrototype,
  workspaceName,
}: {
  onRecentOpenChange: (value: boolean) => void;
  open: boolean;
  onClose: () => void;
  onSearchChange: (value: string) => void;
  recentSessionCards: PrototypeCardData[];
  recentOpen: boolean;
  searchQuery: string;
  onSelectPrototype: (card: PrototypeCardData) => void;
  workspaceName: string;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 top-16 z-40 lg:hidden">
      <button
        aria-label="Close dashboard sidebar"
        className="absolute inset-0 bg-foreground/10"
        onClick={onClose}
        type="button"
      />
      <aside className="absolute left-2 top-2 flex h-[calc(100%-1rem)] w-[min(414px,calc(100vw-1rem))] flex-col rounded-2xl border border-border bg-[oklch(0.965_0_0)] p-3 text-sidebar-foreground shadow-[0_18px_55px_oklch(0.18_0.012_260_/_0.14)]">
        <WorkspaceSidebarContent
          headerAction={
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Close sidebar"
              onClick={onClose}
              type="button"
            >
              <X className="size-4" />
            </Button>
          }
          onRecentOpenChange={onRecentOpenChange}
          onSearchChange={onSearchChange}
          onSelectPrototype={(card) => {
            onClose();
            onSelectPrototype(card);
          }}
          recentOpen={recentOpen}
          recentSessionCards={recentSessionCards}
          searchQuery={searchQuery}
          workspaceName={workspaceName}
        />
      </aside>
    </div>
  );
}

function WorkspaceChrome({
  activeTab,
  addressValue,
  chatOpen,
  canCancelRun,
  canRetryRun,
  learned,
  previewUrl,
  prototype,
  onAddressChange,
  onAddressSubmit,
  onBack,
  onCancelRun,
  onReloadPreview,
  onRetryRun,
  onToggleSidebar,
  onToggleChat,
  onTabChange,
}: {
  activeTab: WorkspaceTab;
  addressValue: string;
  canCancelRun: boolean;
  canRetryRun: boolean;
  chatOpen: boolean;
  learned: boolean;
  previewUrl: string | null;
  prototype: PrototypeCardData;
  onAddressChange: (value: string) => void;
  onAddressSubmit: () => void;
  onBack: () => void;
  onCancelRun: () => void;
  onReloadPreview: () => void;
  onRetryRun: () => void;
  onToggleSidebar: () => void;
  onToggleChat: () => void;
  onTabChange: (tab: WorkspaceTab) => void;
}) {
  const detailSessionId = isBackendSession(prototype)
    ? prototype.id
    : undefined;

  return (
    <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-border/75 bg-white px-3 py-2 lg:flex-nowrap">
      <div className="flex min-w-0 items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Open workspace sidebar"
          onClick={onToggleSidebar}
        >
          <PanelLeft className="size-4" />
        </Button>
        <Button
          asChild
          variant="ghost"
          size="icon-sm"
          aria-label="Back to dashboard"
        >
          <Link
            href="/"
            onClick={(event) => {
              event.preventDefault();
              if (typeof window !== "undefined") {
                window.history.pushState(null, "", "/");
              }
              onBack();
            }}
          >
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Reload preview"
          disabled={!previewUrl}
          onClick={onReloadPreview}
          type="button"
        >
          <RotateCcw className="size-4" />
        </Button>
        <Button
          variant={chatOpen ? "secondary" : "ghost"}
          size="icon-sm"
          className="lg:hidden"
          aria-label="Toggle chat"
          onClick={onToggleChat}
        >
          <PanelLeft className="size-4" />
        </Button>
        {canCancelRun ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Cancel run"
            onClick={onCancelRun}
            type="button"
          >
            <Square className="size-4" />
          </Button>
        ) : null}
        {canRetryRun ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Retry run"
            onClick={onRetryRun}
            type="button"
          >
            <RefreshCcw className="size-4" />
          </Button>
        ) : null}
        <h2 className="truncate px-1 text-sm font-semibold sm:max-w-64">
          {prototype.title}
        </h2>
      </div>

      <div className="order-3 grid w-full min-w-0 grid-cols-5 gap-1 lg:order-none lg:flex lg:w-auto lg:items-center lg:overflow-x-auto">
        {workspaceTabs.map((tab) => (
          <Button
            asChild
            key={tab}
            variant={activeTab === tab ? "secondary" : "ghost"}
            size="sm"
            className="h-9 w-full rounded-full px-2 text-xs sm:px-4 sm:text-[0.8rem] lg:w-auto lg:shrink-0"
          >
            <Link
              href={prototypeUrl({ sessionId: detailSessionId, tab, learned })}
              onClick={(event) => {
                event.preventDefault();
                syncWorkspaceUrl({ sessionId: detailSessionId, tab, learned });
                onTabChange(tab);
              }}
            >
              {tab}
            </Link>
          </Button>
        ))}
      </div>

      <div className="mx-auto hidden min-w-[320px] flex-1 items-center justify-center lg:flex xl:-translate-x-8 2xl:-translate-x-12">
        <form
          className="flex h-9 w-full max-w-xl items-center gap-3 rounded-full border border-border bg-white px-4 text-sm text-muted-foreground shadow-sm focus-within:border-[oklch(0.7_0.1_260)] focus-within:ring-2 focus-within:ring-[oklch(0.82_0.075_260_/_0.45)] 2xl:max-w-2xl"
          onSubmit={(event) => {
            event.preventDefault();
            onAddressSubmit();
          }}
        >
          <RefreshCcw className="size-4" />
          <input
            aria-label="Preview URL"
            className="min-w-0 flex-1 bg-transparent text-center text-foreground outline-none placeholder:text-muted-foreground"
            value={addressValue}
            placeholder={prototype.routePath}
            spellCheck={false}
            onChange={(event) => onAddressChange(event.target.value)}
            onFocus={(event) => event.currentTarget.select()}
          />
          {previewUrl ? (
            <a
              aria-label="Open preview in new tab"
              href={previewUrl}
              rel="noreferrer"
              target="_blank"
            >
              <Globe2 className="size-4 transition-colors hover:text-foreground" />
            </a>
          ) : (
            <Globe2 className="size-4" />
          )}
        </form>
      </div>

    </div>
  );
}

function ChatRail({
  corrections,
  errorMessage,
  learned,
  learnedRules,
  liveStatus,
  messages,
  onImagesChange,
  onCorrectionSubmit,
  onPromptChange,
  onPromptSubmit,
  onRuleStatusChange,
  prompt,
  prototype,
  selectedImages,
  sendingPrompt,
  showCorrectionControls = true,
  submittingCorrection,
}: {
  corrections: CorrectionData[];
  errorMessage: string | null;
  learned: boolean;
  learnedRules: LearnedRuleData[];
  liveStatus: string | null;
  messages: ChatMessageData[];
  onImagesChange: (images: File[]) => void;
  onCorrectionSubmit: (input: {
    afterContext?: string;
    beforeContext?: string;
    correctionText: string;
    targetIdentifier?: string;
    targetScope: "whole_prototype" | "route" | "component" | "file";
  }) => void;
  onPromptChange: (value: string) => void;
  onPromptSubmit: () => void;
  onRuleStatusChange: (
    rule: LearnedRuleData,
    status: LearnedRuleData["status"],
  ) => void;
  prompt: string;
  prototype: PrototypeCardData;
  selectedImages: File[];
  sendingPrompt: boolean;
  showCorrectionControls?: boolean;
  submittingCorrection: boolean;
}) {
  const hasLiveMessages = messages.length > 0;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const selectedImageCount = selectedImages.length;
  const [correctionText, setCorrectionText] = useState("");
  const [targetScope, setTargetScope] =
    useState<"whole_prototype" | "route" | "component" | "file">("route");
  const [beforeContext, setBeforeContext] = useState("");
  const [afterContext, setAfterContext] = useState("");
  const proposedRules = learnedRules.filter((rule) => rule.status === "proposed");
  const libraryRules = learnedRules.filter((rule) => rule.status !== "proposed");

  return (
    <aside className="relative flex h-full min-h-[520px] w-full flex-col bg-white">
      <h2 className="shrink-0 truncate px-4 pt-4 text-sm font-semibold">
        {prototype.title}
      </h2>

      <MessageScrollerProvider>
        <MessageScroller className="flex-1 bg-white">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-6 px-4 pb-36 pt-5">
              {hasLiveMessages ? (
                messages.map((message) => (
                  <MessageScrollerItem
                    key={message.id}
                    scrollAnchor={message.streaming}
                  >
                    <ChatTurn
                      role={message.role}
                      content={message.content}
                      streaming={message.streaming}
                      variant="chatgpt"
                      thinkingLines={[
                        liveStatus ?? "Waiting for the session stream.",
                        "Collecting generated text from session events.",
                        "Preparing the prototype update response.",
                      ]}
                    />
                  </MessageScrollerItem>
                ))
              ) : (
                <>
                  <MessageScrollerItem>
                    <ChatTurn
                      role="user"
                      content={[
                        "Add a post-plan upsell step using the current billing layout.",
                        "It should feel native to the checkout flow and avoid introducing new pricing patterns.",
                      ].join(" ")}
                      variant="chatgpt"
                    />
                  </MessageScrollerItem>

                  <MessageScrollerItem>
                    <ChatTurn
                      role="assistant"
                      content={[
                        "Demo transcript sample: the agent would map the billing route,",
                        "reuse the existing plan card, and prepare a checkout upsell preview.",
                      ].join(" ")}
                      variant="chatgpt"
                    >
                      <Attachment
                        size="sm"
                        className="border-[oklch(0.87_0.004_255)] bg-[oklch(0.985_0.001_255)]"
                      >
                        <AttachmentMedia>
                          <FileCode2 className="size-4" />
                        </AttachmentMedia>
                        <AttachmentContent>
                          <AttachmentTitle>Demo summary</AttachmentTitle>
                          <AttachmentDescription>
                            Static sample, not a live diff
                          </AttachmentDescription>
                        </AttachmentContent>
                      </Attachment>
                    </ChatTurn>
                  </MessageScrollerItem>

                  <MessageScrollerItem>
                    <AgentTodoList
                      className="mx-auto w-full max-w-[75ch]"
                      title="Demo validation sample"
                      items={validationItems.map((item) => ({
                        id: item,
                        label: item,
                        status: "done",
                      }))}
                    />
                  </MessageScrollerItem>

                  <MessageScrollerItem>
                    <ChatTurn
                      role="user"
                      content={[
                        "Use compact billing cards, reduce CTA prominence,",
                        "and follow the existing pricing-card spacing.",
                      ].join(" ")}
                      variant="chatgpt"
                    />
                  </MessageScrollerItem>
                </>
              )}

              {liveStatus ? (
                <MessageScrollerItem>
                  <div className="mx-auto flex w-full max-w-[75ch] items-center gap-2 text-xs font-medium text-muted-foreground">
                    <RefreshCcw className="size-4 text-[var(--codex-blue)]" />
                    {liveStatus}
                  </div>
                </MessageScrollerItem>
              ) : null}

              {errorMessage ? (
                <MessageScrollerItem>
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                    {errorMessage}
                  </div>
                </MessageScrollerItem>
              ) : null}

              {learned ? (
                <>
                  <MessageScrollerItem>
                    <div className="mx-auto flex w-full max-w-[75ch] items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Sparkles className="size-4 text-[var(--codex-purple)]" />
                      Demo correction captured
                    </div>
                  </MessageScrollerItem>
                  <MessageScrollerItem scrollAnchor>
                    <ChatTurn
                      role="assistant"
                      content="Demo response: the regenerated preview would use compact cards and quieter checkout CTAs."
                      variant="chatgpt"
                    />
                  </MessageScrollerItem>
                </>
              ) : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton className="data-[direction=end]:bottom-28" />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="pointer-events-none absolute inset-x-3 bottom-3 z-20">
        <div className="pointer-events-auto rounded-[1.25rem] border border-border/80 bg-white p-3 shadow-[0_16px_48px_oklch(0.35_0.03_255_/_0.16)]">
          <input
            ref={imageInputRef}
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            tabIndex={-1}
            onChange={(event) => {
              onImagesChange(Array.from(event.target.files ?? []).slice(0, 5));
              event.target.value = "";
            }}
          />
          <Textarea
            className="max-h-32 min-h-12 resize-none border-0 bg-transparent px-3 py-1 text-sm leading-6 shadow-none focus-visible:ring-0"
            placeholder="Send a message..."
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                onPromptSubmit();
              }
            }}
          />
          <div className="mt-3 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Upload image"
                disabled={sendingPrompt}
                onClick={() => imageInputRef.current?.click()}
                type="button"
              >
                <Plus className="size-4" />
              </Button>
              {selectedImageCount ? (
                <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="max-w-24 truncate">
                    {selectedImageCount} image
                    {selectedImageCount === 1 ? "" : "s"}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Clear selected images"
                    onClick={() => onImagesChange([])}
                    type="button"
                  >
                    <X className="size-3" />
                  </Button>
                </div>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                className="rounded-full bg-foreground text-background hover:bg-foreground/90"
                aria-label="Send prompt"
                disabled={sendingPrompt || !prompt.trim()}
                onClick={onPromptSubmit}
              >
                {sendingPrompt ? (
                  <Square className="size-4" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </Button>
            </div>
          </div>
          {showCorrectionControls ? (
            <div className="mt-3 border-t border-border/70 pt-3">
              <div className="text-xs font-semibold text-muted-foreground">
                Designer correction
              </div>
              <Textarea
                className="mt-2 min-h-20 text-sm"
                placeholder="Describe what should change and why it should become reusable."
                value={correctionText}
                onChange={(event) => setCorrectionText(event.target.value)}
              />
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  className="h-9 rounded-md border border-input bg-background px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
                  value={targetScope}
                  onChange={(event) =>
                    setTargetScope(
                      event.target.value as "whole_prototype" | "route" | "component" | "file",
                    )
                  }
                >
                  <option value="route">Route</option>
                  <option value="component">Component</option>
                  <option value="file">File</option>
                  <option value="whole_prototype">Whole prototype</option>
                </select>
                <Input
                  className="h-9"
                  placeholder={prototype.routePath}
                  value={beforeContext}
                  onChange={(event) => setBeforeContext(event.target.value)}
                />
              </div>
              <Input
                className="mt-2 h-9"
                placeholder="After context or desired rule wording"
                value={afterContext}
                onChange={(event) => setAfterContext(event.target.value)}
              />
              <Button
                className="mt-2 w-full rounded-full"
                disabled={submittingCorrection || !correctionText.trim()}
                onClick={() => {
                  onCorrectionSubmit({
                    afterContext,
                    beforeContext,
                    correctionText,
                    targetIdentifier: prototype.routePath,
                    targetScope,
                  });
                  setCorrectionText("");
                  setBeforeContext("");
                  setAfterContext("");
                }}
                type="button"
              >
                {submittingCorrection ? "Saving correction" : "Save and propose rule"}
              </Button>
            </div>
          ) : null}
          {showCorrectionControls && (corrections.length || proposedRules.length) ? (
            <div className="mt-3 space-y-2 border-t border-border/70 pt-3">
              {corrections.slice(0, 3).map((correction) => (
                <div
                  key={correction.id}
                  className="rounded-lg border border-border/80 bg-background px-3 py-2 text-xs"
                >
                  <div className="font-medium">{correction.targetScope}</div>
                  <div className="mt-1 line-clamp-2 text-muted-foreground">
                    {correction.correctionText}
                  </div>
                </div>
              ))}
              {proposedRules.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-lg border border-[oklch(0.72_0.09_270)] bg-[oklch(0.95_0.035_274)] px-3 py-2 text-xs"
                >
                  <div className="font-medium">{rule.title}</div>
                  <div className="mt-1 text-muted-foreground">{rule.ruleText}</div>
                  <div className="mt-2 flex gap-1.5">
                    {(["active", "rejected", "archived"] as const).map((status) => (
                      <Button
                        key={status}
                        variant={status === "active" ? "default" : "secondary"}
                        size="sm"
                        className="h-7 rounded-full px-2 text-xs"
                        onClick={() => onRuleStatusChange(rule, status)}
                        type="button"
                      >
                        {status === "active" ? "Accept" : status}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {showCorrectionControls && libraryRules.length ? (
            <div className="mt-3 border-t border-border/70 pt-3">
              <div className="text-xs font-semibold text-muted-foreground">
                Rule library
              </div>
              <div className="mt-2 space-y-2">
                {libraryRules.slice(0, 4).map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-lg border border-border/80 bg-background px-3 py-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">{rule.title}</span>
                      <Badge variant="outline" className="h-5 rounded-full text-[0.68rem]">
                        {rule.status}
                      </Badge>
                    </div>
                    <div className="mt-1 line-clamp-2 text-muted-foreground">
                      {rule.ruleText}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function resolvePrototypePreviewUrl(prototype?: PrototypeCardData | null) {
  if (!prototype) {
    return null;
  }

  if (/^https?:\/\//.test(prototype.preview)) {
    return prototype.preview;
  }

  if (prototype.preview.startsWith("/")) {
    return `${PROTOTYPE_PREVIEW_ORIGIN}${prototype.preview}`;
  }

  if (isBackendSession(prototype) && prototype.routePath.startsWith("/")) {
    return `${PROTOTYPE_PREVIEW_ORIGIN}${getPrototypeItemUrl(prototype.routePath, "current")}`;
  }

  return null;
}

function PreviewDiagnosticState({
  health,
  checking,
  onRetry,
}: {
  health: PreviewHealthData | null;
  checking: boolean;
  onRetry: () => void;
}) {
  return (
    <div className="flex h-full min-h-[560px] items-center justify-center bg-card p-6">
      <div className="w-full max-w-xl rounded-xl border border-border bg-white p-5 text-sm shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-semibold">
              {checking ? "Checking preview" : "Preview unavailable"}
            </h3>
            <p className="mt-1 leading-6 text-muted-foreground">
              {checking
                ? "Validating the configured origin and route before rendering."
                : health?.nextAction ?? "Retry after the preview app is ready."}
            </p>
          </div>
          <Badge
            variant={health?.ok ? "default" : "outline"}
            className={cn(!health?.ok && "bg-white")}
          >
            {checking
              ? "Checking"
              : formatPreviewHealthStatus(health?.status)}
          </Badge>
        </div>

        <div className="mt-4 grid gap-2 rounded-lg border border-border bg-white p-3 font-mono text-xs">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Expected origin</span>
            <span className="truncate">{health?.expectedOrigin ?? "Unknown"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Expected route</span>
            <span className="truncate">{health?.expectedRoute ?? "Any route"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Loaded origin</span>
            <span className="truncate">{health?.origin ?? "None"}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Loaded route</span>
            <span className="truncate">{health?.route ?? "None"}</span>
          </div>
        </div>

        {health?.diagnostics.length ? (
          <div className="mt-4 rounded-lg border border-border/80 bg-white p-3 text-muted-foreground">
            {health.diagnostics[0]}
          </div>
        ) : null}

        <Button
          className="mt-4 rounded-full"
          disabled={checking}
          onClick={onRetry}
          type="button"
        >
          <RefreshCcw className={cn("size-4", checking && "animate-spin")} />
          Retry
        </Button>
      </div>
    </div>
  );
}

function PreviewCanvas({
  iframeKey,
  learned,
  onPreviewUrlChange,
  onRetryPreview,
  previewHealth,
  previewChecking,
  previewUrl,
  prototype,
}: {
  iframeKey?: string;
  learned: boolean;
  onPreviewUrlChange?: (url: string) => void;
  onRetryPreview: () => void;
  previewHealth: PreviewHealthData | null;
  previewChecking: boolean;
  previewUrl: string | null;
  prototype?: PrototypeCardData | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  if (prototype && previewUrl && previewHealth?.ok) {
    return (
      <div className="flex h-full min-h-[560px] flex-col bg-card">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
          <iframe
            ref={iframeRef}
            key={iframeKey ?? previewUrl}
            title={`${prototype.title} preview`}
            src={previewUrl}
            className="min-h-0 flex-1 border-0 bg-background"
            onLoad={() => {
              const nextUrl = readIframeLocation(iframeRef.current);

              if (nextUrl) {
                onPreviewUrlChange?.(nextUrl);
              }
            }}
          />
        </div>
      </div>
    );
  }

  if (prototype && previewUrl) {
    return (
      <PreviewDiagnosticState
        checking={previewChecking}
        health={previewHealth}
        onRetry={onRetryPreview}
      />
    );
  }

  return (
    <div className="flex h-full min-h-[560px] flex-col bg-card">
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-[1.1rem] border border-border bg-[oklch(0.985_0.006_255)] p-4">
        <div className="w-full max-w-5xl rounded-[1.25rem] border border-border bg-background shadow-[0_18px_70px_oklch(0.18_0.012_260_/_0.08)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <div className="text-sm font-semibold">Demo preview sample</div>
              <div className="text-xs text-muted-foreground">
                {learned
                  ? "Demo correction applied locally"
                  : "Static fallback preview"}
              </div>
            </div>
            <Badge className="rounded-full bg-[oklch(0.9_0.075_274)] text-[oklch(0.32_0.13_270)] hover:bg-[oklch(0.9_0.075_274)]">
              Demo data
            </Badge>
          </div>

          <div className="grid gap-6 p-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section>
              <div className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Team plan
              </div>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                Add team seats before you finish checkout
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Your workspace has 8 active collaborators. Add seats now and
                keep billing in one invoice.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {["Starter", "Team", "Team Plus"].map((plan, index) => (
                  <div
                    key={plan}
                    className={cn(
                      "rounded-xl border bg-card p-4",
                      index === 1 &&
                        "border-[oklch(0.55_0.16_265)] bg-[oklch(0.955_0.028_270)]",
                      learned && "p-3",
                    )}
                  >
                    <div className="text-sm font-semibold">{plan}</div>
                    <div className="mt-3 text-xl font-semibold">
                      ${index === 0 ? "12" : index === 1 ? "24" : "39"}
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {learned
                        ? "Compact terms, matching billing cards."
                        : "Expanded card copy with heavier CTA spacing."}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <div className="font-medium">Order summary</div>
                <Badge variant="outline" className="rounded-full">
                  Monthly
                </Badge>
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current plan</span>
                  <span>$192</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">8 team seats</span>
                  <span>$72</span>
                </div>
                <div className="flex justify-between border-t border-border pt-3 font-semibold">
                  <span>Total due today</span>
                  <span>$264</span>
                </div>
              </div>
              <Button
                className={cn(
                  "mt-5 w-full rounded-full",
                  learned
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-[var(--codex-blue)] hover:bg-[oklch(0.48_0.23_269)]",
                )}
              >
                Add seats
              </Button>
              <Button variant="ghost" className="mt-2 w-full rounded-full">
                Skip for now
              </Button>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}

type EnvTarget = "development" | "preview" | "production";

type EnvVariableRow = {
  id: string;
  key: string;
  value: string;
  target: EnvTarget;
  sensitive: boolean;
  required: boolean;
  public: boolean;
  reason: string;
  sources: Array<{ file: string; label?: string }>;
  visible: boolean;
};

function createEnvRowId() {
  return `env-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function envRowsFromRequirements(
  requirements: GuideEnvRequirement[],
): EnvVariableRow[] {
  return requirements.map((requirement) => ({
    id: `detected-${requirement.name}`,
    key: requirement.name,
    value: "",
    target: "development",
    sensitive: !requirement.public,
    required: requirement.required,
    public: requirement.public,
    reason: requirement.reason,
    sources: requirement.sources,
    visible: false,
  }));
}

function parseEnvBlock(value: string): EnvVariableRow[] {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const normalizedLine = line.replace(/^export\s+/, "");
      const separatorIndex = normalizedLine.indexOf("=");
      const key = normalizedLine.slice(0, separatorIndex).trim();
      const rawValue = normalizedLine.slice(separatorIndex + 1).trim();
      const unquotedValue =
        (rawValue.startsWith('"') && rawValue.endsWith('"')) ||
        (rawValue.startsWith("'") && rawValue.endsWith("'"))
          ? rawValue.slice(1, -1)
          : rawValue;

      return {
        id: createEnvRowId(),
        key,
        value: unquotedValue,
        target: "development" as const,
        sensitive: !key.startsWith("NEXT_PUBLIC_"),
        required: true,
        public: key.startsWith("NEXT_PUBLIC_"),
        reason: "Imported from pasted env",
        sources: [],
        visible: false,
      };
    })
    .filter((row) => /^[A-Z][A-Z0-9_]*$/.test(row.key));
}

function serializeClientEnvValue(value: string) {
  if (!value) {
    return "";
  }

  if (/[\n\r]/.test(value) || /^\s|\s$|[#"'`]/.test(value)) {
    return JSON.stringify(value);
  }

  return value;
}

function serializeEnvRows(rows: EnvVariableRow[]) {
  return rows
    .filter((row) => row.key.trim())
    .map((row) => `${row.key.trim()}=${serializeClientEnvValue(row.value)}`)
    .join("\n");
}

function ToolbarIconButton({
  children,
  disabled,
  label,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-md"
          disabled={disabled}
          aria-label={label}
          onClick={onClick}
          type="button"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>{label}</TooltipContent>
    </Tooltip>
  );
}

function SetupCanvas({
  projectGuide,
  prototype,
  repoConnection,
}: {
  projectGuide: ProjectGuideData | null;
  prototype: PrototypeCardData;
  repoConnection: RepoConnectionData | null;
}) {
  const [refreshedGuide, setRefreshedGuide] =
    useState<ProjectGuideData | null>(null);
  const activeProjectGuide = refreshedGuide ?? projectGuide;
  const [envRows, setEnvRows] = useState<EnvVariableRow[]>([]);
  const displayRows = envRows;
  const [pasteValue, setPasteValue] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [envError, setEnvError] = useState<string | null>(null);
  const [savingEnv, setSavingEnv] = useState(false);
  const [refreshingGuide, setRefreshingGuide] = useState(false);
  const contextRows = [
    {
      name: "Repo",
      value: repoConnection?.repoFullName ?? prototype?.branch ?? "Current repo",
    },
    {
      name: "Branch",
      value: repoConnection?.branch ?? prototype?.branch ?? "Current branch",
    },
    {
      name: "Prototype root",
      value: repoConnection?.prototypeRoot ?? ".",
    },
    {
      name: "Preview origin",
      value:
        repoConnection?.previewOrigin ??
        (prototype ? resolvePrototypePreviewUrl(prototype) : null) ??
        "Not configured",
    },
    {
      name: "Guide commit",
      value:
        activeProjectGuide?.guide.commitSha?.slice(0, 7) ??
        repoConnection?.currentCommitSha?.slice(0, 7) ??
        "Not scanned",
    },
    {
      name: "Session route",
      value: prototype?.routePath ?? "Current session",
    },
  ];
  const envText = serializeEnvRows(displayRows);

  function updateEnvRow(
    rowId: string,
    patch: Partial<Omit<EnvVariableRow, "id">>,
  ) {
    setEnvRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              ...patch,
              public:
                patch.key !== undefined
                  ? patch.key.startsWith("NEXT_PUBLIC_")
                  : row.public,
            }
          : row,
      ),
    );
  }

  function addManualRow() {
    setEnvRows((currentRows) => [
      ...currentRows,
      {
        id: createEnvRowId(),
        key: "",
        value: "",
        target: "development",
        sensitive: true,
        required: false,
        public: false,
        reason: "Manual variable",
        sources: [],
        visible: false,
      },
    ]);
  }

  function parsePastedEnv() {
    const parsedRows = parseEnvBlock(pasteValue);

    if (parsedRows.length === 0) {
      setEnvError("Paste one or more KEY=value lines.");
      return;
    }

    setEnvRows(parsedRows);
    setPasteOpen(false);
    setEnvError(null);
    setSaveStatus(null);
  }

  async function refreshGuide() {
    setRefreshingGuide(true);
    setEnvError(null);

    try {
      const nextGuide = await scanCurrentRepo();
      const nextRequirements = nextGuide.guide.content.environment ?? [];

      setRefreshedGuide(nextGuide);
      setEnvRows(envRowsFromRequirements(nextRequirements));
      setSaveStatus(`Imported ${nextRequirements.length} detected variables.`);
    } catch (error) {
      setEnvError(
        error instanceof Error ? error.message : "Failed to refresh guide",
      );
    } finally {
      setRefreshingGuide(false);
    }
  }

  async function copyEnvText() {
    if (!envText || typeof navigator === "undefined") {
      return;
    }

    await navigator.clipboard.writeText(`${envText}\n`);
    setCopyStatus("Copied .env text");
    window.setTimeout(() => setCopyStatus(null), 1400);
  }

  async function saveEnvFile() {
    const variables = displayRows
      .filter((row) => row.key.trim())
      .map((row) => ({
        key: row.key.trim(),
        value: row.value,
        target: row.target,
        sensitive: row.sensitive,
      }));

    if (variables.length === 0) {
      setEnvError("Add at least one environment variable.");
      return;
    }

    setSavingEnv(true);
    setEnvError(null);

    try {
      const response = await saveRepoEnvironment(variables);

      setSaveStatus(
        `Saved ${response.variableCount} variables to ${response.path}`,
      );
    } catch (error) {
      setEnvError(
        error instanceof Error ? error.message : "Failed to save env file",
      );
    } finally {
      setSavingEnv(false);
    }
  }

  return (
    <div className="h-full min-h-[560px] overflow-y-auto bg-card p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 py-10">
        <div className="max-w-3xl">
          <h3 className="text-2xl font-semibold tracking-tight">
            Set up prototype context
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Import detected keys, paste an env file, or enter variables
            manually. Values are written to the connected preview checkout.
          </p>
        </div>

        <section className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="grid grid-cols-[0.8fr_1.2fr] border-b border-border bg-white px-4 py-3 text-sm font-medium">
            <span>Context</span>
            <span>Value</span>
          </div>
          {contextRows.map((row) => (
            <div
              key={row.name}
              className="grid grid-cols-[0.8fr_1.2fr] items-center gap-3 border-b border-border/70 bg-white px-4 py-3 text-sm last:border-b-0"
            >
              <span className="text-muted-foreground">{row.name}</span>
              <span className="min-w-0 truncate font-medium">{row.value}</span>
            </div>
          ))}
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-white">
          <div className="border-b border-border bg-white px-4 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <h4 className="text-sm font-semibold">
                  Environment variables
                </h4>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center xl:justify-end">
                <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-white p-1">
                  <ToolbarIconButton
                    label="Refresh detected variables"
                    disabled={refreshingGuide}
                    onClick={refreshGuide}
                  >
                    <RefreshCcw
                      className={cn(
                        "size-4",
                        refreshingGuide && "animate-spin",
                      )}
                    />
                  </ToolbarIconButton>
                  <ToolbarIconButton
                    label="Paste .env"
                    onClick={() => setPasteOpen((value) => !value)}
                  >
                    <FileCode2 className="size-4" />
                  </ToolbarIconButton>
                  <ToolbarIconButton
                    label="Add variable"
                    onClick={addManualRow}
                  >
                    <Plus className="size-4" />
                  </ToolbarIconButton>
                  <div className="mx-1 h-5 w-px bg-border" />
                  <ToolbarIconButton
                    label={copyStatus ?? "Copy .env text"}
                    disabled={!envText}
                    onClick={copyEnvText}
                  >
                    <Copy className="size-4" />
                  </ToolbarIconButton>
                </div>

                <Button
                  className="h-11 w-full justify-center px-5 text-base sm:w-auto"
                  disabled={savingEnv || displayRows.length === 0}
                  onClick={saveEnvFile}
                  type="button"
                >
                  {savingEnv ? "Saving" : "Save .env.local"}
                </Button>
              </div>
            </div>
          </div>

          {pasteOpen ? (
            <div className="border-b border-border bg-white px-4 py-4">
              <Textarea
                className="min-h-36 bg-white font-mono text-xs"
                placeholder={"DATABASE_URL=mongodb+srv://...\nNEXTAUTH_SECRET=..."}
                value={pasteValue}
                onChange={(event) => setPasteValue(event.target.value)}
              />
              <div className="mt-3 flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  className="rounded-full"
                  onClick={() => setPasteOpen(false)}
                  type="button"
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-full"
                  onClick={parsePastedEnv}
                  type="button"
                >
                  Parse into table
                </Button>
              </div>
            </div>
          ) : null}

          {envRows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="border-b border-border bg-white text-left text-xs font-medium text-muted-foreground">
                  <tr>
                    <th className="w-[280px] px-4 py-3">Key</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="w-[120px] px-4 py-3">Secret</th>
                    <th className="w-[56px] px-4 py-3" aria-label="Actions" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/70">
                  {envRows.map((row) => (
                    <tr key={row.id} className="bg-white align-top">
                      <td className="px-4 py-3">
                        <Input
                          className="h-9 bg-white font-mono text-xs"
                          placeholder="VARIABLE_NAME"
                          value={row.key}
                          onChange={(event) =>
                            updateEnvRow(row.id, {
                              key: event.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9_]/g, ""),
                            })
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="relative">
                          <Input
                            className={cn(
                              "h-9 bg-white font-mono text-xs",
                              row.sensitive && "pr-10",
                            )}
                            placeholder="Paste value"
                            type={
                              row.sensitive && !row.visible
                                ? "password"
                                : "text"
                            }
                            value={row.value}
                            onChange={(event) =>
                              updateEnvRow(row.id, {
                                value: event.target.value,
                              })
                            }
                          />
                          {row.sensitive ? (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="absolute right-1 top-1/2 -translate-y-1/2 transition-none hover:bg-transparent active:!translate-y-[-50%]"
                              aria-label={
                                row.visible ? "Hide value" : "Show value"
                              }
                              onClick={() =>
                                updateEnvRow(row.id, {
                                  visible: !row.visible,
                                })
                              }
                              type="button"
                            >
                              {row.visible ? (
                                <EyeOff className="size-4" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <label className="flex h-9 items-center gap-2 text-sm">
                          <Switch
                            checked={row.sensitive}
                            aria-label={`Mark ${row.key || "variable"} as secret`}
                            onCheckedChange={(checked) =>
                              updateEnvRow(row.id, {
                                sensitive: checked,
                              })
                            }
                          />
                          <span>Secret</span>
                        </label>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="mx-auto rounded-md"
                          aria-label={`Remove ${row.key || "variable"}`}
                          onClick={() =>
                            setEnvRows((currentRows) =>
                              currentRows.filter(
                                (currentRow) => currentRow.id !== row.id,
                              ),
                            )
                          }
                          type="button"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-white px-6 py-12 text-center">
              <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-white text-muted-foreground">
                <FileCode2 className="size-5" />
              </div>
              <h5 className="mt-4 text-sm font-medium">
                No environment variables yet
              </h5>
              <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                Import detected keys, paste an env file, or add a variable to
                build the `.env.local` table.
              </p>
            </div>
          )}

          {envError || saveStatus ? (
            <div
              className={cn(
                "border-t border-border px-4 py-3 text-sm",
                envError
                  ? "text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {envError ?? saveStatus}
            </div>
          ) : null}
        </section>

        <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6 text-muted-foreground">
          Save writes `.env.local` in the connected checkout only. Restart the
          preview dev server after saving so Next.js reloads the values.
        </div>
      </div>
    </div>
  );
}

function DesktopCanvas({
  iframeKey,
  learned,
  onPreviewUrlChange,
  onRetryPreview,
  previewChecking,
  previewHealth,
  previewUrl,
  prototype,
}: {
  iframeKey: string;
  learned: boolean;
  onPreviewUrlChange: (url: string) => void;
  onRetryPreview: () => void;
  previewChecking: boolean;
  previewHealth: PreviewHealthData | null;
  previewUrl: string | null;
  prototype: PrototypeCardData;
}) {
  if (previewUrl) {
    return (
      <PreviewCanvas
        iframeKey={iframeKey}
        learned={learned}
        onPreviewUrlChange={onPreviewUrlChange}
        onRetryPreview={onRetryPreview}
        previewChecking={previewChecking}
        previewHealth={previewHealth}
        previewUrl={previewUrl}
        prototype={prototype}
      />
    );
  }

  return (
    <div className="relative flex h-full min-h-[560px] items-center justify-center bg-[oklch(0.88_0.004_255)] text-sm font-medium text-muted-foreground">
      No preview URL is available yet.
    </div>
  );
}

function ChangesCanvas({
  handoff,
  learned,
}: {
  handoff: HandoffData | null;
  learned: boolean;
}) {
  const files = handoff?.files.length ? handoff.files : diffFiles;

  return (
    <div className="h-full min-h-[560px] overflow-auto bg-card p-4">
      {handoff ? (
        <>
          <div className="mb-3 flex items-center justify-between rounded-lg border border-border bg-white px-3 py-2 text-sm">
            <Badge
              variant="outline"
              className="rounded-full bg-white font-mono"
            >
              {handoff.run.outputCommitSha?.slice(0, 7) ??
                handoff.run.inputCommitSha?.slice(0, 7)}
            </Badge>
            <span className="text-muted-foreground">{handoff.run.status}</span>
          </div>
          <div className="mb-4 rounded-xl border border-border/80 bg-white p-3 text-sm">
            <div className="font-medium">Run handoff</div>
            <p className="mt-1 leading-6 text-muted-foreground">
              {handoff.summary}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline" className="rounded-full">
                Preview {handoff.previewHealth.status}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                Tests {handoff.tests.status}
              </Badge>
              <Badge variant="outline" className="rounded-full">
                {handoff.appliedRules.length} rules applied
              </Badge>
            </div>
            {handoff.tests.results?.length ? (
              <AiDataTable
                className="mt-3"
                columns={[
                  { key: "command", header: "Command", className: "font-mono text-xs" },
                  { key: "status", header: "Status", className: "w-28" },
                  { key: "duration", header: "Duration", className: "w-28 text-right" },
                ]}
                rows={handoff.tests.results.map((result) => ({
                  id: result.command,
                  cells: {
                    command: <span className="block max-w-[28rem] truncate">{result.command}</span>,
                    status: result.status,
                    duration: `${result.durationMs}ms`,
                  },
                }))}
              />
            ) : null}
            {handoff.appliedRules.length ? (
              <div className="mt-3 space-y-1 text-xs">
                {handoff.appliedRules.map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/80 px-2 py-1.5"
                  >
                    <span className="truncate">
                      {application.rule?.title ?? "Learned rule"}
                    </span>
                    <Badge variant="outline" className="h-5 rounded-full text-[0.68rem]">
                      {application.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
      <div className="space-y-6">
        {files.map((file) => {
          const rows: CodeDiffRow[] = handoff
            ? rowsFromUnifiedDiff(handoff.diffSnippet, file.file)
            : (file as (typeof diffFiles)[number]).rows;

          return (
            <CodeDiff
              key={file.file}
              file={file.file}
              rows={rows}
              added={file.added}
              removed={file.removed}
            />
          );
        })}
        {learned ? (
          <Marker className="rounded-xl border border-[oklch(0.72_0.09_270)] bg-[oklch(0.95_0.035_274)] p-3 text-foreground">
            <MarkerIcon>
              <Sparkles className="text-[var(--codex-purple)]" />
            </MarkerIcon>
            <MarkerContent>
              Demo correction sample: compact billing card preference.
            </MarkerContent>
          </Marker>
        ) : null}
        {handoff?.risks.length ? (
          <Marker className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-700">
            <MarkerIcon>
              <CircleHelp className="text-rose-600" />
            </MarkerIcon>
            <MarkerContent>{handoff.risks[0]}</MarkerContent>
          </Marker>
        ) : null}
      </div>
    </div>
  );
}

function LogsCanvas({
  events,
  learned,
}: {
  events: RunEventData[];
  learned: boolean;
}) {
  const logs = events.length
    ? events.map((event) => [
        new Date(event.createdAt).toLocaleTimeString(),
        event.source,
        event.message ?? event.type,
      ])
    : learned
      ? [...learnedLogs, ...baseLogs]
      : baseLogs;

  return (
    <div className="flex h-full min-h-[560px] flex-col bg-card p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">
            {events.length ? "Run logs" : "Sample logs"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length
              ? "Events emitted by this run."
              : "Static sample events are shown until a run emits logs."}
          </p>
        </div>
      </div>
      <AiDataTable
        columns={[
          { key: "time", header: "Time", className: "w-40 font-mono text-xs" },
          { key: "source", header: "Source", className: "w-40 font-mono text-xs" },
          { key: "message", header: "Message", className: "font-mono text-xs" },
        ]}
        rows={logs.map(([time, source, message]) => ({
          id: `${time}-${message}`,
          cells: {
            time,
            source,
            message: <span className="block max-w-[36rem] truncate">{message}</span>,
          },
        }))}
      />
    </div>
  );
}

function WorkspaceCanvas({
  activeTab,
  events,
  handoff,
  iframeKey,
  learned,
  onPreviewUrlChange,
  onRetryPreview,
  previewChecking,
  previewHealth,
  previewUrl,
  prototype,
  projectGuide,
  repoConnection,
}: {
  activeTab: WorkspaceTab;
  events: RunEventData[];
  handoff: HandoffData | null;
  iframeKey: string;
  learned: boolean;
  onPreviewUrlChange: (url: string) => void;
  onRetryPreview: () => void;
  previewChecking: boolean;
  previewHealth: PreviewHealthData | null;
  previewUrl: string | null;
  prototype: PrototypeCardData;
  projectGuide: ProjectGuideData | null;
  repoConnection: RepoConnectionData | null;
}) {
  if (activeTab === "Setup") {
    return (
      <SetupCanvas
        projectGuide={projectGuide}
        prototype={prototype}
        repoConnection={repoConnection}
      />
    );
  }

  if (activeTab === "Desktop") {
    return (
      <DesktopCanvas
        iframeKey={iframeKey}
        learned={learned}
        onPreviewUrlChange={onPreviewUrlChange}
        onRetryPreview={onRetryPreview}
        previewChecking={previewChecking}
        previewHealth={previewHealth}
        previewUrl={previewUrl}
        prototype={prototype}
      />
    );
  }

  if (activeTab === "Changes") {
    return <ChangesCanvas handoff={handoff} learned={learned} />;
  }

  if (activeTab === "Logs") {
    return <LogsCanvas events={events} learned={learned} />;
  }

  return (
    <PreviewCanvas
      iframeKey={iframeKey}
      learned={learned}
      onPreviewUrlChange={onPreviewUrlChange}
      onRetryPreview={onRetryPreview}
      previewChecking={previewChecking}
      previewHealth={previewHealth}
      previewUrl={previewUrl}
      prototype={prototype}
    />
  );
}

function PrototypeWorkspace({
  chatError,
  chatImages,
  chatMessages,
  chatPrompt,
  initialLearned = false,
  initialTab = "Preview",
  liveStatus,
  onChatImagesChange,
  onChatErrorChange,
  onChatPromptChange,
  onChatPromptSubmit,
  onLiveStatusChange,
  onPatchPrototype,
  prototype,
  projectGuide,
  recentSessionCards,
  repoConnection,
  onBack,
  onSelectPrototype,
  sendingPrompt,
  showCorrectionControls = true,
  workspaceName,
}: {
  chatError: string | null;
  chatImages: File[];
  chatMessages: ChatMessageData[];
  chatPrompt: string;
  initialLearned?: boolean;
  initialTab?: WorkspaceTab;
  liveStatus: string | null;
  onChatImagesChange: (images: File[]) => void;
  onChatErrorChange: (value: string | null) => void;
  onChatPromptChange: (value: string) => void;
  onChatPromptSubmit: () => void;
  onLiveStatusChange: (value: string | null) => void;
  onPatchPrototype: (
    updater: (card: PrototypeCardData) => PrototypeCardData,
  ) => void;
  prototype: PrototypeCardData;
  projectGuide: ProjectGuideData | null;
  recentSessionCards: PrototypeCardData[];
  repoConnection: RepoConnectionData | null;
  onBack: () => void;
  onSelectPrototype: (card: PrototypeCardData) => void;
  sendingPrompt: boolean;
  showCorrectionControls?: boolean;
  workspaceName: string;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [learned, setLearned] = useState(initialLearned);
  const [handoff, setHandoff] = useState<HandoffData | null>(null);
  const [runEvents, setRunEvents] = useState<RunEventData[]>([]);
  const [corrections, setCorrections] = useState<CorrectionData[]>([]);
  const [learnedRules, setLearnedRules] = useState<LearnedRuleData[]>([]);
  const [submittingCorrection, setSubmittingCorrection] = useState(false);
  const [chatOpen, setChatOpen] = useState(true);
  const workspaceSplitRef = useRef<HTMLDivElement>(null);
  const [chatPanelWidth, setChatPanelWidth] = useState(() => {
    if (typeof window === "undefined") {
      return CHAT_PANEL_DEFAULT_WIDTH;
    }

    const storedWidth = Number(
      window.localStorage.getItem(CHAT_PANEL_WIDTH_STORAGE_KEY),
    );

    return Number.isFinite(storedWidth)
      ? constrainChatPanelWidth(storedWidth)
      : CHAT_PANEL_DEFAULT_WIDTH;
  });
  const [resizingChatPanel, setResizingChatPanel] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [recentOpen, setRecentOpen] = useState(true);
  const resolvedPreviewUrl = resolvePrototypePreviewUrl(prototype);
  const [addressValue, setAddressValue] = useState(
    resolvedPreviewUrl ?? prototype.routePath,
  );
  const [previewUrl, setPreviewUrl] = useState(resolvedPreviewUrl);
  const [previewReloadKey, setPreviewReloadKey] = useState(0);
  const [previewHealth, setPreviewHealth] = useState<PreviewHealthData | null>(
    null,
  );
  const [previewChecking, setPreviewChecking] = useState(false);
  const detailSessionId = isBackendSession(prototype)
    ? prototype.id
    : undefined;
  const iframeKey = `preview:${previewReloadKey}`;
  const activeRunId =
    prototype.latestRunId ?? prototype.lastSuccessfulRunId ?? null;
  const canCancelRun = prototype.sessionStatus === "processing";
  const canRetryRun = ["error", "failed", "cancelled", "timed_out"].includes(
    prototype.sessionStatus,
  );
  const expectedPreviewOrigin = normalizePreviewOrigin(
    repoConnection?.previewOrigin ?? PROTOTYPE_PREVIEW_ORIGIN,
  );
  const expectedPreviewRoute = normalizeExpectedPreviewRoute(
    prototype.routePath,
  );

  const resizeChatPanel = useCallback((clientX: number) => {
    const splitRect = workspaceSplitRef.current?.getBoundingClientRect();

    if (!splitRect) {
      return;
    }

    setChatPanelWidth(
      constrainChatPanelWidth(clientX - splitRect.left, splitRect.width),
    );
  }, []);

  const handleChatResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setResizingChatPanel(true);
      resizeChatPanel(event.clientX);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      function handlePointerMove(moveEvent: PointerEvent) {
        resizeChatPanel(moveEvent.clientX);
      }

      function handlePointerEnd() {
        setResizingChatPanel(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerEnd);
        window.removeEventListener("pointercancel", handlePointerEnd);
      }

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerEnd, { once: true });
      window.addEventListener("pointercancel", handlePointerEnd, {
        once: true,
      });
    },
    [resizeChatPanel],
  );

  const resizeChatPanelBy = useCallback((delta: number) => {
    const containerWidth = workspaceSplitRef.current?.getBoundingClientRect()
      .width;

    setChatPanelWidth((currentWidth) =>
      constrainChatPanelWidth(currentWidth + delta, containerWidth),
    );
  }, []);

  const handleChatResizeKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        resizeChatPanelBy(-CHAT_PANEL_KEYBOARD_STEP);
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        resizeChatPanelBy(CHAT_PANEL_KEYBOARD_STEP);
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        setChatPanelWidth(CHAT_PANEL_MIN_WIDTH);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        const containerWidth = workspaceSplitRef.current?.getBoundingClientRect()
          .width;
        setChatPanelWidth(
          constrainChatPanelWidth(CHAT_PANEL_MAX_WIDTH, containerWidth),
        );
      }
    },
    [resizeChatPanelBy],
  );

  const syncPreviewUrlFromFrame = useCallback((value: string) => {
    const nextPreviewUrl = normalizePreviewAddress(value);

    if (!nextPreviewUrl) {
      return;
    }

    setPreviewUrl(nextPreviewUrl);
    setAddressValue(nextPreviewUrl);
  }, []);

  const commitPreviewAddress = useCallback(() => {
    const nextPreviewUrl = normalizePreviewAddress(addressValue);

    setPreviewUrl(nextPreviewUrl);
    setAddressValue(nextPreviewUrl ?? "");
    setPreviewReloadKey((value) => value + 1);
  }, [addressValue]);

  const reloadPreview = useCallback(() => {
    if (!previewUrl) {
      return;
    }

    setPreviewReloadKey((value) => value + 1);
  }, [previewUrl]);

  useEffect(() => {
    window.localStorage.setItem(
      CHAT_PANEL_WIDTH_STORAGE_KEY,
      String(chatPanelWidth),
    );
  }, [chatPanelWidth]);

  useEffect(() => {
    function constrainWidthForViewport() {
      const containerWidth = workspaceSplitRef.current?.getBoundingClientRect()
        .width;

      setChatPanelWidth((currentWidth) =>
        constrainChatPanelWidth(currentWidth, containerWidth),
      );
    }

    constrainWidthForViewport();
    window.addEventListener("resize", constrainWidthForViewport);

    return () => {
      window.removeEventListener("resize", constrainWidthForViewport);
    };
  }, []);

  const handleCancelRun = useCallback(() => {
    if (!activeRunId) {
      return;
    }

    void cancelRun(activeRunId)
      .then((run) => {
        onPatchPrototype((card) => ({
          ...card,
          status: "Draft",
          sessionStatus: run.status,
        }));
        onLiveStatusChange(run.status);
      })
      .catch((error) => {
        onChatErrorChange(
          error instanceof Error ? error.message : "Failed to cancel run",
        );
      });
  }, [activeRunId, onChatErrorChange, onLiveStatusChange, onPatchPrototype]);

  const handleRetryRun = useCallback(() => {
    if (!activeRunId) {
      return;
    }

    void retryRun(activeRunId)
      .then((run) => {
        onPatchPrototype((card) => ({
          ...card,
          latestRunId: run.id,
          status: "Draft",
          sessionStatus: run.status,
        }));
        onLiveStatusChange("processing");
      })
      .catch((error) => {
        onChatErrorChange(
          error instanceof Error ? error.message : "Failed to retry run",
        );
      });
  }, [activeRunId, onChatErrorChange, onLiveStatusChange, onPatchPrototype]);

  useEffect(() => {
    let cancelled = false;
    const applyPreviewState = (callback: () => void) => {
      window.setTimeout(() => {
        if (!cancelled) {
          callback();
        }
      }, 0);
    };

    if (!previewUrl) {
      applyPreviewState(() => {
        setPreviewHealth(null);
        setPreviewChecking(false);
      });

      return () => {
        cancelled = true;
      };
    }

    const localDiagnostic = validatePreviewLocally(
      previewUrl,
      expectedPreviewOrigin,
      expectedPreviewRoute,
    );

    if (localDiagnostic) {
      applyPreviewState(() => {
        setPreviewHealth(localDiagnostic);
        setPreviewChecking(false);
      });

      return () => {
        cancelled = true;
      };
    }

    applyPreviewState(() => {
      setPreviewChecking(true);
      setPreviewHealth(
        createPreviewDiagnostic({
          previewUrl,
          expectedOrigin: expectedPreviewOrigin,
          expectedRoute: expectedPreviewRoute,
          status: "checking",
          diagnostics: ["Checking preview health."],
          nextAction: "Wait for the preview health check.",
        }),
      );
    });

    void (activeRunId
      ? fetchRunPreviewHealth(activeRunId)
      : fetchPreviewHealth(previewUrl, expectedPreviewRoute))
      .then((health) => {
        if (!cancelled) {
          setPreviewHealth(health);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setPreviewHealth(
            createPreviewDiagnostic({
              previewUrl,
              expectedOrigin: expectedPreviewOrigin,
              expectedRoute: expectedPreviewRoute,
              status: "health_check_failed",
              diagnostics: [
                error instanceof Error
                  ? error.message
                  : "Preview health request failed.",
              ],
              nextAction:
                "Retry the preview health check or confirm the preview app is running.",
            }),
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPreviewChecking(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    expectedPreviewOrigin,
    expectedPreviewRoute,
    activeRunId,
    previewReloadKey,
    previewUrl,
  ]);

  useEffect(() => {
    function handlePreviewMessage(event: MessageEvent) {
      const parsedPreviewUrl = parsePreviewUrl(previewUrl);

      if (!parsedPreviewUrl || event.origin !== parsedPreviewUrl.origin) {
        return;
      }

      if (
        !event.data ||
        typeof event.data !== "object" ||
        event.data.type !== "archetype:preview-url" ||
        typeof event.data.url !== "string"
      ) {
        return;
      }

      syncPreviewUrlFromFrame(event.data.url);
    }

    window.addEventListener("message", handlePreviewMessage);

    return () => {
      window.removeEventListener("message", handlePreviewMessage);
    };
  }, [previewUrl, syncPreviewUrlFromFrame]);

  useEffect(() => {
    if (!activeRunId || TEST_MODE) {
      return;
    }

    let cancelled = false;

    void Promise.all([
      fetchRunHandoff(activeRunId).catch(() => null),
      fetchRunEvents(activeRunId).catch(() => []),
    ]).then(([nextHandoff, nextEvents]) => {
      if (cancelled) {
        return;
      }

      setHandoff(nextHandoff);
      setRunEvents(nextEvents);
    });

    return () => {
      cancelled = true;
    };
  }, [activeRunId, prototype.sessionStatus]);

  useEffect(() => {
    if (!detailSessionId || TEST_MODE) {
      return;
    }

    let cancelled = false;

    void Promise.all([
      fetchSessionCorrections(detailSessionId).catch(() => []),
      fetchLearnedRules().catch(() => []),
    ]).then(([nextCorrections, nextRules]) => {
      if (cancelled) {
        return;
      }

      setCorrections(nextCorrections);
      setLearnedRules(nextRules);
      setLearned(nextRules.some((rule) => rule.status === "active"));
    });

    return () => {
      cancelled = true;
    };
  }, [detailSessionId]);

  const correctionHandler = async (input: {
    afterContext?: string;
    beforeContext?: string;
    correctionText: string;
    targetIdentifier?: string;
    targetScope: "whole_prototype" | "route" | "component" | "file";
  }) => {
    if (!detailSessionId || TEST_MODE) {
      setLearned(true);
      syncWorkspaceUrl({
        sessionId: detailSessionId,
        tab: activeTab,
        learned: true,
      });
      return;
    }

    setSubmittingCorrection(true);

    try {
      const correction = await createSessionCorrection({
        ...input,
        runId: activeRunId,
        sessionId: detailSessionId,
      });
      const rule = await proposeLearnedRule(correction.id);

      setCorrections((current) => [correction, ...current]);
      setLearnedRules((current) => [rule, ...current]);
    } catch (error) {
      setLearned(false);
      onChatErrorChange(
        error instanceof Error ? error.message : "Failed to save correction",
      );
    } finally {
      setSubmittingCorrection(false);
    }
  };

  const handleRuleStatusChange = async (
    rule: LearnedRuleData,
    status: LearnedRuleData["status"],
  ) => {
    const updatedRule = await updateLearnedRule(rule.id, { status });

    setLearnedRules((current) =>
      current.map((item) => (item.id === updatedRule.id ? updatedRule : item)),
    );
    setLearned(status === "active");
    syncWorkspaceUrl({
      sessionId: detailSessionId,
      tab: activeTab,
      learned: status === "active",
    });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <WorkspaceSidebarOverlay
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onRecentOpenChange={setRecentOpen}
        onSearchChange={setSidebarSearch}
        onSelectPrototype={onSelectPrototype}
        recentOpen={recentOpen}
        recentSessionCards={recentSessionCards}
        searchQuery={sidebarSearch}
        workspaceName={workspaceName}
      />
      <WorkspaceChrome
        activeTab={activeTab}
        addressValue={addressValue}
        canCancelRun={canCancelRun}
        canRetryRun={canRetryRun}
        chatOpen={chatOpen}
        learned={learned}
        previewUrl={previewUrl}
        prototype={prototype}
        onAddressChange={setAddressValue}
        onAddressSubmit={commitPreviewAddress}
        onBack={onBack}
        onCancelRun={handleCancelRun}
        onReloadPreview={reloadPreview}
        onRetryRun={handleRetryRun}
        onToggleSidebar={() => setSidebarOpen((value) => !value)}
        onToggleChat={() => setChatOpen((value) => !value)}
        onTabChange={setActiveTab}
      />
      <div
        ref={workspaceSplitRef}
        className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white lg:flex-row"
        style={
          {
            "--chat-panel-width": `${chatPanelWidth}px`,
          } as React.CSSProperties
        }
      >
        <div
          className={cn(
            "h-[42vh] min-h-[360px] w-full overflow-hidden bg-white lg:h-full lg:w-[var(--chat-panel-width)] lg:shrink-0",
            !chatOpen && "hidden lg:block",
          )}
        >
          <ChatRail
            corrections={corrections}
            errorMessage={chatError}
            learned={learned}
            learnedRules={learnedRules}
            liveStatus={liveStatus}
            messages={chatMessages}
            onImagesChange={onChatImagesChange}
            onCorrectionSubmit={(input) => {
              void correctionHandler(input);
            }}
            onPromptChange={onChatPromptChange}
            onPromptSubmit={onChatPromptSubmit}
            onRuleStatusChange={(rule, status) => {
              void handleRuleStatusChange(rule, status);
            }}
            prompt={chatPrompt}
            prototype={prototype}
            selectedImages={chatImages}
            sendingPrompt={sendingPrompt}
            showCorrectionControls={showCorrectionControls}
            submittingCorrection={submittingCorrection}
          />
        </div>
        {chatOpen ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                role="separator"
                aria-label="Resize chat and preview"
                aria-orientation="vertical"
                aria-valuemin={CHAT_PANEL_MIN_WIDTH}
                aria-valuemax={CHAT_PANEL_MAX_WIDTH}
                aria-valuenow={chatPanelWidth}
                className={cn(
                  "group hidden w-3 shrink-0 cursor-col-resize appearance-none items-center justify-center self-stretch border-0 bg-white p-0 text-muted-foreground shadow-none outline-none transition-colors hover:bg-white hover:text-foreground active:bg-white focus-visible:bg-white focus-visible:text-foreground focus-visible:ring-3 focus-visible:ring-ring/35 lg:flex",
                  resizingChatPanel && "text-foreground",
                )}
                onKeyDown={handleChatResizeKeyDown}
                onPointerDown={handleChatResizePointerDown}
              >
                <GripVertical className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Resize panels</TooltipContent>
          </Tooltip>
        ) : null}
        <main className="m-2 min-h-0 flex-1 overflow-auto rounded-[1rem] border border-border bg-card shadow-[0_18px_54px_oklch(0.35_0.03_255_/_0.12)] lg:ml-0">
          <WorkspaceCanvas
            activeTab={activeTab}
            events={runEvents}
            handoff={handoff}
            iframeKey={iframeKey}
            learned={learned}
            onPreviewUrlChange={syncPreviewUrlFromFrame}
            onRetryPreview={reloadPreview}
            previewChecking={previewChecking}
            previewHealth={previewHealth}
            previewUrl={previewUrl}
            prototype={prototype}
            projectGuide={projectGuide}
            repoConnection={repoConnection}
          />
        </main>
      </div>
    </div>
  );
}

function AppShell() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [repoConnection, setRepoConnection] =
    useState<RepoConnectionData | null>(null);
  const [sessionCards, setSessionCards] = useState<PrototypeCardData[]>([]);
  const [projectGuide, setProjectGuide] = useState<ProjectGuideData | null>(
    null,
  );
  const [prompt, setPrompt] = useState("");
  const [creatingSession, setCreatingSession] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarMotion, setSidebarMotion] = useState<"smooth" | "instant">(
    "smooth",
  );
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(true);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const toggleSidebar = useCallback((source: "pointer" | "keyboard") => {
    setSidebarMotion(source === "keyboard" ? "instant" : "smooth");
    setSidebarCollapsed((value) => !value);
  }, []);

  const handleSelectPrototype = useCallback(
    (card: PrototypeCardData) => {
      if (isBackendSession(card)) {
        router.push(prototypeUrl({ sessionId: card.id, tab: "Preview" }));
        return;
      }

      router.push(prototypeUrl({ tab: "Preview" }));
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDashboardData() {
      try {
        const [workspacePayload, sessions, repoPayload, guidePayload] =
          await Promise.all([
          fetchWorkspaceSummary(),
          fetchSessionSummaries(),
          fetchRepoConnection().catch(() => null),
          fetchProjectGuide().catch(() => null),
        ]);

        if (cancelled) {
          return;
        }

        setWorkspace(workspacePayload);
        setRepoConnection(repoPayload);
        setProjectGuide(guidePayload);
        setSessionCards(sessions.map(sessionToPrototypeCard));
      } catch {
        // Keep the dashboard usable with empty local data when the API is offline.
      }
    }

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    function handleKeyboardShortcut(event: KeyboardEvent) {
      const isSidebarShortcut =
        event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !event.shiftKey &&
        event.key.toLowerCase() === "b";

      if (!isSidebarShortcut || event.repeat || event.isComposing) {
        return;
      }

      event.preventDefault();
      toggleSidebar("keyboard");
    }

    window.addEventListener("keydown", handleKeyboardShortcut);

    return () => {
      window.removeEventListener("keydown", handleKeyboardShortcut);
    };
  }, [toggleSidebar]);

  async function handleCreateSession(images: File[] = []) {
    const brief = prompt.trim();
    const title = deriveSessionTitle(brief);

    if (!brief || creatingSession) {
      return;
    }

    try {
      setCreatingSession(true);
      const payload = await createSession(title);
      const nextCard = sessionToPrototypeCard(payload);

      if (images.length > 0) {
        await submitSessionPrompt(payload.id, brief, images);
      } else if (typeof window !== "undefined") {
        window.sessionStorage.setItem(`pending-prompt:${payload.id}`, brief);
      }
      setSessionCards((current) => [nextCard, ...current]);
      setPrompt("");
      router.push(prototypeUrl({ sessionId: payload.id, tab: "Preview" }));
    } catch {
      const fallbackSession = createLocalSessionSummary(title);
      const nextCard = sessionToPrototypeCard(fallbackSession);

      setSessionCards((current) => [nextCard, ...current]);
      setPrompt("");
    } finally {
      setCreatingSession(false);
    }
  }

  const recentSessionCards = useMemo(
    () => sessionCards.slice(0, 8),
    [sessionCards],
  );
  const sidebarTransition =
    sidebarMotion === "smooth"
      ? "duration-200 ease-[cubic-bezier(0.32,0.72,0,1)]"
      : "duration-0 ease-linear";

  return (
    <main className="h-screen overflow-hidden bg-[oklch(0.965_0_0)] text-foreground">
      <DashboardSidebarOverlay
        open={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onRecentOpenChange={setRecentOpen}
        onSearchChange={setSidebarSearch}
        recentOpen={recentOpen}
        recentSessionCards={recentSessionCards}
        searchQuery={sidebarSearch}
        onSelectPrototype={handleSelectPrototype}
        workspaceName={workspace?.name ?? "Archetype"}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 hidden overflow-hidden bg-[oklch(0.965_0_0)] py-4 text-sidebar-foreground transition-[width] will-change-[width] motion-reduce:transition-none lg:flex lg:flex-col",
          sidebarTransition,
          sidebarCollapsed ? "w-0 px-0" : "w-[280px] px-3",
        )}
      >
        {sidebarCollapsed ? null : (
          <WorkspaceSidebarContent
            onRecentOpenChange={setRecentOpen}
            onSearchChange={setSidebarSearch}
            onSelectPrototype={handleSelectPrototype}
            projectGuide={projectGuide}
            recentOpen={recentOpen}
            recentSessionCards={recentSessionCards}
            searchQuery={sidebarSearch}
            showProjectGuide={SHOW_PROJECT_GUIDE_FEATURE}
            workspaceName={workspace?.name ?? "Archetype"}
          />
        )}
      </aside>

      <section
        className={cn(
          "flex h-screen min-w-0 flex-col transition-[padding-left] will-change-[padding-left] motion-reduce:transition-none",
          sidebarTransition,
          sidebarCollapsed ? "lg:pl-0" : "lg:pl-[280px]",
        )}
      >
        <header
          className={cn(
            "fixed inset-x-0 top-0 z-40 flex h-16 shrink-0 items-center justify-between bg-[oklch(0.965_0_0)] px-4 transition-[left] will-change-[left] motion-reduce:transition-none sm:px-6",
            sidebarTransition,
            sidebarCollapsed ? "lg:left-0" : "lg:left-[280px]",
          )}
        >
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="hidden lg:inline-flex"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => toggleSidebar("pointer")}
              type="button"
            >
              <PanelLeft className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="Open sidebar"
              onClick={() => setMobileSidebarOpen(true)}
              type="button"
            >
              <PanelLeft className="size-4" />
            </Button>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              Prototypes
            </h1>
          </div>
        </header>

        <div className="min-h-0 flex-1 pt-16">
          <div className="h-full overflow-hidden rounded-tl-[24px] border-l border-t border-border/80 bg-card/75">
            <DashboardView
              key={
                repoConnection
                  ? [
                      repoConnection.id ?? "current",
                      repoConnection.repoFullName ?? "",
                      repoConnection.branch ?? "",
                      repoConnection.prototypeRoot ?? "",
                      repoConnection.previewOrigin ?? "",
                    ].join(":")
                  : "repo:none"
              }
              creatingSession={creatingSession}
              onCreateSession={handleCreateSession}
              onPromptChange={setPrompt}
              onRepoConnected={({ connection, guide }) => {
                setRepoConnection(connection);
                setProjectGuide(guide);
              }}
              onSelectPrototype={handleSelectPrototype}
              prompt={prompt}
              prototypeCards={sessionCards}
              projectGuide={projectGuide}
              repoConnection={repoConnection}
              workspace={workspace}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

export default function HomeClient({
  initialWorkspace,
}: {
  initialWorkspace: InitialWorkspaceState;
}) {
  void initialWorkspace;

  return (
    <AuthGate>
      <AppShell />
    </AuthGate>
  );
}

function PrototypeDetailInner({
  initialWorkspace,
  sessionId,
}: {
  initialWorkspace: InitialWorkspaceState;
  sessionId?: string;
}) {
  const router = useRouter();
  const [prototype, setPrototype] = useState<PrototypeCardData | null>(
    sessionId ? null : prototypeCards[0],
  );
  const [chatImages, setChatImages] = useState<File[]>([]);
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [repoConnection, setRepoConnection] =
    useState<RepoConnectionData | null>(null);
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [sessionCards, setSessionCards] = useState<PrototypeCardData[]>([]);
  const [projectGuide, setProjectGuide] = useState<ProjectGuideData | null>(
    null,
  );
  const [sendingPrompt, setSendingPrompt] = useState(false);

  const patchPrototype = useCallback(
    (updater: (card: PrototypeCardData) => PrototypeCardData) => {
      setPrototype((current) => (current ? updater(current) : current));
    },
    [],
  );

  const submitPromptForDetail = useCallback(
    async (content: string, images: File[] = []) => {
      if (!sessionId) {
        return;
      }

      const trimmedContent = content.trim();

      if (!trimmedContent) {
        return;
      }

      setSendingPrompt(true);
      setChatError(null);
      setChatMessages((current) => [
        ...current,
        {
          id: `user-${sessionId}-${Date.now()}`,
          role: "user",
          content: trimmedContent,
        },
      ]);

      try {
        const assistantMessage = await submitSessionPrompt(
          sessionId,
          trimmedContent,
          images,
        );

        if (assistantMessage && "role" in assistantMessage) {
          setChatMessages((current) => [...current, assistantMessage]);
          patchPrototype((card) => ({
            ...card,
            status: "Ready",
            sessionStatus: "new_ready",
          }));
          setLiveStatus("new_ready");
        } else {
          patchPrototype((card) => ({
            ...card,
            status: "Draft",
            sessionStatus: "processing",
            latestRunId:
              assistantMessage && "runId" in assistantMessage
                ? assistantMessage.runId
                : card.latestRunId,
          }));
          setLiveStatus("processing");
        }
      } catch (error) {
        setChatError(
          error instanceof Error ? error.message : "Failed to submit prompt",
        );
      } finally {
        setSendingPrompt(false);
      }
    },
    [patchPrototype, sessionId],
  );

  const handlePromptSubmit = useCallback(() => {
    const content = chatPrompt.trim();
    const images = chatImages;

    if (!content || sendingPrompt) {
      return;
    }

    setChatPrompt("");
    setChatImages([]);
    void submitPromptForDetail(content, images);
  }, [chatImages, chatPrompt, sendingPrompt, submitPromptForDetail]);

  const handleSelectPrototype = useCallback(
    (card: PrototypeCardData) => {
      if (isBackendSession(card)) {
        router.push(prototypeUrl({ sessionId: card.id, tab: "Preview" }));
        return;
      }

      router.push(prototypeUrl({ tab: "Preview" }));
    },
    [router],
  );

  useEffect(() => {
    let cancelled = false;

    void Promise.all([
      fetchWorkspaceSummary().catch(() => null),
      fetchSessionSummaries().catch(() => []),
      fetchRepoConnection().catch(() => null),
      fetchProjectGuide().catch(() => null),
    ]).then(
      ([
        nextWorkspace,
        nextSessionSummaries,
        nextRepoConnection,
        nextProjectGuide,
      ]) => {
      if (cancelled) {
        return;
      }

      setWorkspace(nextWorkspace);
      setSessionCards(nextSessionSummaries.map(sessionToPrototypeCard));
      setRepoConnection(nextRepoConnection);
      setProjectGuide(nextProjectGuide);
      },
    );

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const detailSessionId = sessionId;
    let cancelled = false;

    if (TEST_MODE) {
      void Promise.all([
        fetchSessionDetail(detailSessionId),
        fetchSessionMessages(detailSessionId),
      ])
        .then(([detail, messages]) => {
          if (cancelled) {
            return;
          }

          applyDetail(detail);
          setChatMessages(messages);
          setChatError(null);

          if (typeof window !== "undefined") {
            const storageKey = `pending-prompt:${detailSessionId}`;
            const pendingPrompt = window.sessionStorage.getItem(storageKey);

            if (pendingPrompt) {
              window.sessionStorage.removeItem(storageKey);
              void submitPromptForDetail(pendingPrompt);
            }
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setChatError(
              error instanceof Error ? error.message : "Failed to load session",
            );
          }
        });

      return () => {
        cancelled = true;
      };
    }

    const eventSource = new EventSource(
      `${API_BASE_URL}/sessions/${detailSessionId}/events`,
      {
        withCredentials: true,
      },
    );

    function parsePayload(event: MessageEvent<string>): SessionEventPayload {
      try {
        return JSON.parse(event.data) as SessionEventPayload;
      } catch {
        return {
          message: event.data,
        };
      }
    }

    function applyDetail(detail: SessionDetailResponse) {
      setPrototype((current) =>
        current
          ? applySessionDetailToCard(current, detail)
          : sessionDetailToPrototypeCard(detail),
      );
    }

    function refreshSessionDetail() {
      void fetchSessionDetail(detailSessionId)
        .then((detail) => {
          if (!cancelled) {
            applyDetail(detail);
            setChatError(null);
          }
        })
        .catch((error) => {
          if (!cancelled) {
            setChatError(
              error instanceof Error
                ? error.message
                : "Failed to refresh session detail",
            );
          }
        });
    }

    function markAssistantDone() {
      setChatMessages((current) =>
        current.map((message) =>
          message.streaming ? { ...message, streaming: false } : message,
        ),
      );
    }

    void Promise.all([
      fetchSessionDetail(detailSessionId),
      fetchSessionMessages(detailSessionId),
    ])
      .then(([detail, messages]) => {
        if (cancelled) {
          return;
        }

        applyDetail(detail);
        setChatMessages(messages);
      })
      .catch((error) => {
        if (!cancelled) {
          setChatError(
            error instanceof Error ? error.message : "Failed to load session",
          );
        }
      });

    eventSource.onopen = () => {
      if (typeof window === "undefined") {
        return;
      }

      const storageKey = `pending-prompt:${detailSessionId}`;
      const pendingPrompt = window.sessionStorage.getItem(storageKey);

      if (pendingPrompt) {
        window.sessionStorage.removeItem(storageKey);
        void submitPromptForDetail(pendingPrompt);
      }
    };

    eventSource.addEventListener("session_status", (event) => {
      const payload = parsePayload(event as MessageEvent<string>);
      const status = payload.status ?? "processing";

      setLiveStatus(payload.message ?? status);
      patchPrototype((card) => ({
        ...card,
        status: mapSessionStatus(status),
        sessionStatus: status,
        latestRunId: payload.runId ?? card.latestRunId,
      }));
    });

    eventSource.addEventListener("ai_delta", (event) => {
      const payload = parsePayload(event as MessageEvent<string>);
      const delta = payload.delta ?? "";

      if (!delta) {
        return;
      }

      setChatMessages((current) => {
        const lastMessage = current[current.length - 1];

        if (lastMessage?.role === "assistant" && lastMessage.streaming) {
          return [
            ...current.slice(0, -1),
            {
              ...lastMessage,
              content: `${lastMessage.content}${delta}`,
            },
          ];
        }

        return [
          ...current,
          {
            id: `assistant-${detailSessionId}-${Date.now()}`,
            role: "assistant",
            content: delta,
            streaming: true,
          },
        ];
      });
    });

    (
      ["current_ready", "new_reloading", "new_ready"] as SessionLiveEvent[]
    ).forEach((eventName) => {
      eventSource.addEventListener(eventName, (event) => {
        const payload = parsePayload(event as MessageEvent<string>);
        const status = eventName === "new_reloading" ? "processing" : eventName;
        const urlNote = payload.url ? `: ${payload.url}` : "";

        setLiveStatus(`${eventName}${urlNote}`);
        patchPrototype((card) => ({
          ...card,
          status: mapSessionStatus(status),
          sessionStatus: status,
          latestRunId: payload.runId ?? card.latestRunId,
          lastSuccessfulRunId:
            eventName !== "new_reloading"
              ? payload.runId ?? card.lastSuccessfulRunId
              : card.lastSuccessfulRunId,
          preview: payload.url ?? card.preview,
          notes: payload.url ? `Preview: ${payload.url}` : card.notes,
        }));

        if (eventName !== "new_reloading") {
          markAssistantDone();
          refreshSessionDetail();
        }
      });
    });

    eventSource.onerror = () => {
      if (!cancelled) {
        setLiveStatus("SSE disconnected, retrying...");
      }
    };

    return () => {
      cancelled = true;
      eventSource.close();
    };
  }, [patchPrototype, sessionId, submitPromptForDetail]);

  if (!prototype) {
    return (
      <main className="grid h-screen place-items-center bg-card text-sm text-muted-foreground">
        {chatError ?? "Loading prototype workspace..."}
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-card text-foreground">
      <PrototypeWorkspace
        key={`${prototype.id}:${resolvePrototypePreviewUrl(prototype) ?? prototype.routePath}`}
        chatError={chatError}
        chatImages={chatImages}
        chatMessages={chatMessages}
        chatPrompt={chatPrompt}
        initialLearned={initialWorkspace.learned}
        initialTab={initialWorkspace.tab}
        liveStatus={liveStatus}
        onChatImagesChange={setChatImages}
        onChatErrorChange={setChatError}
        onChatPromptChange={setChatPrompt}
        onChatPromptSubmit={handlePromptSubmit}
        onLiveStatusChange={setLiveStatus}
        onPatchPrototype={patchPrototype}
        prototype={prototype}
        projectGuide={projectGuide}
        recentSessionCards={sessionCards.slice(0, 8)}
        repoConnection={repoConnection}
        onBack={() => router.push("/")}
        onSelectPrototype={handleSelectPrototype}
        sendingPrompt={sendingPrompt}
        showCorrectionControls={false}
        workspaceName={workspace?.name ?? "Archetype"}
      />
    </main>
  );
}

export function PrototypeDetailClient(props: {
  initialWorkspace: InitialWorkspaceState;
  sessionId?: string;
}) {
  return (
    <AuthGate>
      <PrototypeDetailInner {...props} />
    </AuthGate>
  );
}
