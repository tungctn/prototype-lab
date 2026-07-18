"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Bell,
  Bot,
  Box,
  Camera,
  Check,
  ChevronDown,
  CircleHelp,
  Columns2,
  Copy,
  FileCode2,
  GitBranch,
  Globe2,
  Grid2X2,
  History,
  ImagePlus,
  LayoutDashboard,
  Link2,
  List,
  MessageCircle,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  Plus,
  RefreshCcw,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  WandSparkles,
} from "lucide-react";

import {
  Attachment,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
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

type WorkspaceSummary = {
  id: string;
  name: string;
  repoName: string;
  prototypeRoot: string;
  status: "ready";
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
};

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
  status?: string;
  url?: string;
};

const repoSignals = [
  { label: "12 routes mapped", value: "routes" },
  { label: "34 components inferred", value: "components" },
  { label: "3 designer rules learned", value: "rules" },
];

const prototypeCards: PrototypeCardData[] = [
  {
    id: "demo-checkout-upsell",
    files: 5,
    added: 382,
    removed: 0,
    title: "Checkout Upsell Flow",
    branch: "prototype/checkout-upsell",
    status: "Ready",
    owner: "LL",
    time: "1mo",
    fit: "94%",
    learned: "Pricing card spacing",
    notes: "Add a post-plan upsell step using the current billing layout.",
    preview: "checkout",
    routePath: "/prototype/checkout-upsell",
    routeSlug: "checkout-upsell",
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
    notes: "Clarify the first-run state for teams with no connected repo.",
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
    notes: "Summarize intent, touched components, decisions, and review risks.",
    preview: "handoff",
    routePath: "/prototype/handoff-summary",
    routeSlug: "handoff-summary",
    sessionStatus: "processing",
  },
];

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

const diffFiles = [
  {
    file: "app/billing/checkout/page.tsx",
    added: 126,
    lines: [
      "const upsellPlan = getPlanBySlug('team-plus')",
      "<PlanComparison compact selectedPlan={currentPlan} />",
      '<Button size="sm">Add team seats</Button>',
    ],
  },
  {
    file: "components/billing/plan-card.tsx",
    added: 42,
    lines: [
      "variant={learnedRules.includes('compact-billing-card') ? 'compact' : 'default'}",
      'className="gap-3 rounded-xl border-border bg-card"',
    ],
  },
  {
    file: ".codex/living-system.json",
    added: 1,
    lines: [
      '"compact-billing-card": "Use tight billing card spacing before promoting checkout CTAs"',
    ],
  },
];

const baseLogs = [
  [
    "14:47:39.102",
    "system",
    "Loaded prototype branch prototype/checkout-upsell",
  ],
  [
    "14:47:39.247",
    "analysis",
    "Resolved billing route, shared plan card, and checkout CTA pattern",
  ],
  ["14:47:40.003", "agent", "Generated preview for checkout upsell step"],
  ["14:47:40.219", "validation", "System fit scored at 94 percent"],
];

const learnedLogs = [
  [
    "14:48:12.406",
    "designer",
    "Correction accepted: compact billing cards and quieter CTA",
  ],
  ["14:48:12.612", "living-system", "Saved reusable rule compact-billing-card"],
  ["14:48:13.081", "agent", "Regenerated checkout preview using learned rule"],
  ["14:48:13.304", "validation", "System fit improved to 97 percent"],
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

  return {
    ...card,
    title: detail.title,
    status: mapSessionStatus(detail.status),
    notes: newPreview
      ? `New preview: ${newPreview}`
      : currentPreview
        ? `Current preview: ${currentPreview}`
        : `Session route: ${detail.routePath}`,
    preview: newPreview ?? currentPreview ?? card.preview,
    routePath: detail.routePath,
    sessionStatus: detail.status,
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
    },
    detail,
  );
}

function isBackendSession(card: PrototypeCardData) {
  return !card.id.startsWith("demo-");
}

async function fetchSessionDetail(sessionId: string) {
  const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Session detail request failed with ${response.status}`);
  }

  return (await response.json()) as SessionDetailResponse;
}

async function fetchSessionMessages(sessionId: string) {
  const response = await fetch(
    `${API_BASE_URL}/sessions/${sessionId}/messages`,
    {
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Messages request failed with ${response.status}`);
  }

  const payload = (await response.json()) as SessionMessagesResponse;

  return payload.items;
}

async function submitSessionPrompt(sessionId: string, content: string) {
  const body = new FormData();
  body.set("content", content);

  const response = await fetch(
    `${API_BASE_URL}/sessions/${sessionId}/prompts`,
    {
      method: "POST",
      body,
    },
  );

  if (!response.ok) {
    throw new Error(`Submit prompt failed with ${response.status}`);
  }
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

function ToolButton({
  label,
  icon: Icon,
}: {
  label: string;
  icon: typeof Search;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full bg-card">
          <Icon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function PrototypeBlank({ card }: { card: PrototypeCardData }) {
  return (
    <div className="relative h-48 rounded-[1.35rem] border border-border/80 bg-card shadow-none sm:h-52">
      <div className="absolute left-6 top-5 text-sm font-semibold text-muted-foreground">
        {card.files} files
      </div>
      <div className="absolute right-6 top-5 flex items-center gap-2.5 font-mono text-sm font-semibold">
        <span className="text-emerald-600">+{card.added}</span>
        <span className="text-rose-500">-{card.removed}</span>
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
          <p className="mt-0.5 text-xs text-muted-foreground">{card.time}</p>
        </div>
      </div>
    </button>
  );
}

function DashboardView({
  creatingSession,
  errorMessage,
  onCreateSession,
  onPromptChange,
  onSelectPrototype,
  prompt,
  prototypeCards,
  workspace,
}: {
  creatingSession: boolean;
  errorMessage: string | null;
  onCreateSession: () => void;
  onPromptChange: (value: string) => void;
  onSelectPrototype: (card: PrototypeCardData) => void;
  prompt: string;
  prototypeCards: PrototypeCardData[];
  workspace: WorkspaceSummary | null;
}) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="relative min-h-full">
        <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-8 lg:px-12">
          <section className="mx-auto flex min-h-[640px] w-full max-w-3xl flex-col items-center justify-center pb-8 pt-10 text-center lg:min-h-[690px]">
            <HeroLogo />
            <div className="mt-7 space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                {workspace
                  ? `Pre-connected repo ${workspace.repoName}, production components, learned patterns`
                  : "Pre-connected repo, production components, learned patterns"}
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-5xl">
                Build with your real product
              </h2>
            </div>

            <div className="mt-7 flex w-full flex-col gap-3 rounded-2xl border border-[oklch(0.47_0.22_269_/_0.18)] bg-[oklch(0.9_0.075_274_/_0.78)] p-3 text-left text-sm font-medium text-accent-foreground sm:flex-row sm:items-center sm:rounded-full sm:p-2 sm:pl-4">
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
                <Sparkles className="mt-0.5 size-4 shrink-0 text-[var(--codex-blue)] sm:mt-0" />
                <span className="min-w-0 flex-1">
                  Project guide ready: routes, components, and patterns inferred
                  from code.
                </span>
              </div>
              <Button className="rounded-full px-5">View guide</Button>
            </div>

            <Card className="mt-4 w-full rounded-[1.4rem] bg-card/95 p-0 shadow-[0_24px_70px_oklch(0.18_0.012_260_/_0.1)]">
              <CardContent className="p-0">
                <Textarea
                  className="min-h-36 resize-none rounded-t-[1.4rem] border-0 bg-transparent p-5 text-base shadow-none focus-visible:ring-0"
                  placeholder="Write the PM brief: problem, target user flow, acceptance criteria, and the product area this should modify..."
                  value={prompt}
                  onChange={(event) => onPromptChange(event.target.value)}
                />
                <div className="flex flex-col gap-3 border-t border-border/70 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 rounded-full"
                    >
                      <MessageSquare className="size-4" />
                      PM brief
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 rounded-full"
                    >
                      <GitBranch className="size-4" />
                      {workspace?.repoName ?? "Connected repo"}
                      <ChevronDown className="size-3.5" />
                    </Button>
                  </div>
                  <Button
                    className="gap-1.5 rounded-full px-4"
                    disabled={creatingSession || !prompt.trim()}
                    onClick={onCreateSession}
                  >
                    {creatingSession ? "Generating..." : "Generate prototype"}
                    <ArrowUp className="size-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {errorMessage ? (
              <p className="mt-3 text-sm text-rose-600">{errorMessage}</p>
            ) : null}

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {repoSignals.map((signal) => (
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
          </section>

          <section className="mt-10">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-72">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="h-10 rounded-full bg-background/72 pl-9"
                    placeholder="Search prototypes"
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="rounded-full bg-card">
                      Last edited
                      <ChevronDown className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Last edited</DropdownMenuItem>
                    <DropdownMenuItem>Highest system fit</DropdownMenuItem>
                    <DropdownMenuItem>Ready for review</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full bg-card"
                >
                  <Plus className="size-4" />
                </Button>
                <Tabs defaultValue="grid">
                  <TabsList className="rounded-full bg-muted/80">
                    <TabsTrigger value="grid" className="rounded-full px-3">
                      <Grid2X2 className="size-4" />
                    </TabsTrigger>
                    <TabsTrigger value="list" className="rounded-full px-3">
                      <List className="size-4" />
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            <div className="mt-6 grid gap-7 lg:grid-cols-3 xl:gap-8">
              {prototypeCards.length > 0 ? (
                prototypeCards.map((card) => (
                  <PrototypeCard
                    card={card}
                    key={card.id}
                    onSelect={onSelectPrototype}
                  />
                ))
              ) : (
                <div className="rounded-[1.35rem] border border-dashed border-border/80 bg-background/64 p-6 text-sm text-muted-foreground lg:col-span-3">
                  No prototype sessions yet. Generate the first prompt to create
                  a new session slug.
                </div>
              )}
            </div>

            <div className="mt-5 rounded-2xl border border-border/80 bg-background/64 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-medium">Living System signal</h3>
                  <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                    Designer corrections are captured as reusable rules, so the
                    next prototype starts closer to the real product.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="h-7 rounded-full bg-card px-3"
                >
                  <Link2 className="size-3.5" />3 corrections learned
                </Badge>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function WorkspaceSidebarOverlay({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
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
      <aside className="absolute left-2 top-2 flex h-[calc(100%-1rem)] w-[min(360px,calc(100vw-1rem))] flex-col rounded-2xl border border-border bg-background p-3 shadow-[0_18px_55px_oklch(0.18_0.012_260_/_0.14)]">
        <div className="flex items-center justify-between px-1">
          <div className="flex min-w-0 items-center gap-2">
            <Avatar className="size-7 border border-border">
              <AvatarFallback className="bg-[oklch(0.86_0.045_255)] text-xs">
                5g
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" className="gap-1 px-1.5">
              5gl
              <ChevronDown className="size-3.5" />
            </Button>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Collapse sidebar"
            onClick={onClose}
          >
            <PanelLeft className="size-4" />
          </Button>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-10 rounded-full border-transparent bg-muted/55 pl-9 shadow-none"
            placeholder="Search"
          />
        </div>

        <nav className="mt-4 space-y-1 text-sm font-medium">
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-2 rounded-xl px-3"
          >
            <Box className="size-4" />
            Sessions
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-2 rounded-xl px-3"
          >
            <Camera className="size-4" />
            Captures
          </Button>
        </nav>

        <div className="mt-5 flex items-center justify-between px-1 text-sm font-medium text-muted-foreground">
          Recent
          <ChevronDown className="size-4" />
        </div>
        <div className="mt-2 space-y-1">
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-2 rounded-xl px-3 text-sm font-semibold"
          >
            <span className="size-2 rounded-full bg-[var(--codex-blue)]" />
            Checkout Upsell Flow
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-2 rounded-xl px-3 text-sm"
          >
            <span className="size-2 rounded-full bg-[var(--codex-blue)]/75" />
            Settings Empty State
          </Button>
          <Button
            variant="ghost"
            className="h-9 w-full justify-start gap-2 rounded-xl px-3 text-sm"
          >
            <span className="size-2 rounded-full bg-[var(--codex-blue)]/75" />
            Handoff Summary
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon-sm"
          className="mt-auto rounded-full bg-card"
          aria-label="Help"
        >
          <CircleHelp className="size-4" />
        </Button>
      </aside>
    </div>
  );
}

function WorkspaceChrome({
  activeTab,
  chatOpen,
  learned,
  previewUrl,
  prototype,
  onBack,
  onToggleSidebar,
  onToggleChat,
  onTabChange,
}: {
  activeTab: WorkspaceTab;
  chatOpen: boolean;
  learned: boolean;
  previewUrl: string | null;
  prototype: PrototypeCardData;
  onBack: () => void;
  onToggleSidebar: () => void;
  onToggleChat: () => void;
  onTabChange: (tab: WorkspaceTab) => void;
}) {
  const detailSessionId = isBackendSession(prototype)
    ? prototype.id
    : undefined;

  return (
    <div className="flex min-h-14 shrink-0 flex-wrap items-center gap-2 border-b border-border/75 bg-card px-3 py-2 lg:flex-nowrap">
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
        <Button variant="ghost" size="icon-sm" aria-label="Forward">
          <ArrowRight className="size-4 text-muted-foreground" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Reload">
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
        <h2 className="truncate px-1 text-sm font-semibold sm:max-w-64">
          {prototype.title}
        </h2>
        <Button variant="ghost" size="icon-sm" aria-label="Workspace menu">
          <MoreHorizontal className="size-4" />
        </Button>
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

      <div className="mx-auto hidden min-w-[240px] max-w-md flex-1 items-center justify-center lg:flex">
        <div className="flex h-9 w-full max-w-sm items-center gap-3 rounded-full border border-border bg-background px-4 text-sm text-muted-foreground shadow-sm">
          <RefreshCcw className="size-4" />
          <span className="min-w-0 flex-1 truncate text-center text-foreground">
            {previewUrl ?? prototype.routePath}
          </span>
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
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" aria-label="Comments">
          <MessageCircle className="size-4" />
        </Button>
        <Button variant="ghost" size="icon-sm" aria-label="Split layout">
          <Columns2 className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="hidden gap-2 rounded-full bg-card sm:flex"
        >
          <GitBranch className="size-4" />
          Push code
        </Button>
        <Button
          size="sm"
          className="rounded-full bg-[var(--codex-blue)] px-4 text-primary-foreground hover:bg-[oklch(0.48_0.23_269)]"
        >
          Share
        </Button>
      </div>
    </div>
  );
}

function ChatRail({
  activeTab,
  errorMessage,
  learned,
  liveStatus,
  messages,
  onLearn,
  onPromptChange,
  onPromptSubmit,
  prompt,
  prototype,
  sendingPrompt,
}: {
  activeTab: WorkspaceTab;
  errorMessage: string | null;
  learned: boolean;
  liveStatus: string | null;
  messages: ChatMessageData[];
  onLearn: () => void;
  onPromptChange: (value: string) => void;
  onPromptSubmit: () => void;
  prompt: string;
  prototype: PrototypeCardData;
  sendingPrompt: boolean;
}) {
  const hasLiveMessages = messages.length > 0;

  return (
    <aside className="flex h-full min-h-[520px] flex-col bg-background/72 lg:w-[360px] lg:min-w-[360px]">
      <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
        <Avatar className="size-7 border border-border">
          <AvatarFallback className="bg-[oklch(0.86_0.045_255)] text-xs">
            LL
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">
            {prototype.title}
          </div>
          <div className="text-xs text-muted-foreground">
            {liveStatus ?? prototype.sessionStatus}
          </div>
        </div>
        <Badge variant="outline" className="rounded-full bg-card text-xs">
          5gl
        </Badge>
      </div>

      <MessageScrollerProvider>
        <MessageScroller className="flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="gap-5 p-4">
              {hasLiveMessages ? (
                messages.map((message) => (
                  <MessageScrollerItem
                    key={message.id}
                    scrollAnchor={message.streaming}
                  >
                    <MessageGroup>
                      <Message
                        align={message.role === "user" ? "end" : "start"}
                      >
                        {message.role !== "user" ? (
                          <MessageAvatar>
                            <Bot className="size-4" />
                          </MessageAvatar>
                        ) : null}
                        <MessageContent>
                          {message.role !== "user" ? (
                            <MessageHeader>Archetype</MessageHeader>
                          ) : null}
                          <Bubble
                            align={message.role === "user" ? "end" : "start"}
                            variant={
                              message.role === "user" ? "secondary" : "outline"
                            }
                          >
                            <BubbleContent>
                              {message.content || "Đang xử lý..."}
                            </BubbleContent>
                          </Bubble>
                          {message.streaming ? (
                            <MessageFooter>
                              Streaming from session events
                            </MessageFooter>
                          ) : null}
                        </MessageContent>
                      </Message>
                    </MessageGroup>
                  </MessageScrollerItem>
                ))
              ) : (
                <>
                  <MessageScrollerItem>
                    <MessageGroup>
                      <Message align="end">
                        <MessageContent>
                          <Bubble variant="secondary" align="end">
                            <BubbleContent>
                              Add a post-plan upsell step using the current
                              billing layout. It should feel native to the
                              checkout flow and avoid introducing new pricing
                              patterns.
                            </BubbleContent>
                          </Bubble>
                        </MessageContent>
                      </Message>
                    </MessageGroup>
                  </MessageScrollerItem>

                  <MessageScrollerItem>
                    <Message>
                      <MessageAvatar>
                        <Bot className="size-4" />
                      </MessageAvatar>
                      <MessageContent>
                        <MessageHeader>Archetype</MessageHeader>
                        <Bubble variant="outline">
                          <BubbleContent>
                            I mapped the billing route, reused the existing plan
                            card, and created a preview branch with a checkout
                            upsell step.
                          </BubbleContent>
                        </Bubble>
                        <Attachment size="sm" className="bg-card">
                          <AttachmentMedia>
                            <FileCode2 className="size-4" />
                          </AttachmentMedia>
                          <AttachmentContent>
                            <AttachmentTitle>Prototype summary</AttachmentTitle>
                            <AttachmentDescription>
                              5 files changed, +382 lines
                            </AttachmentDescription>
                          </AttachmentContent>
                        </Attachment>
                        <MessageFooter>Worked for 7m 57s</MessageFooter>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>

                  <MessageScrollerItem>
                    <Marker variant="separator">
                      <MarkerIcon>
                        <BadgeCheck className="text-[var(--live)]" />
                      </MarkerIcon>
                      <MarkerContent>Validation</MarkerContent>
                    </Marker>
                  </MessageScrollerItem>

                  <MessageScrollerItem>
                    <div className="space-y-2 rounded-xl border border-border/80 bg-card p-3 text-sm">
                      {validationItems.map((item) => (
                        <div key={item} className="flex gap-2">
                          <Check className="mt-0.5 size-4 shrink-0 text-[var(--live)]" />
                          <span className="leading-5">{item}</span>
                        </div>
                      ))}
                    </div>
                  </MessageScrollerItem>

                  <MessageScrollerItem>
                    <Message align="end">
                      <MessageContent>
                        <MessageHeader>Designer correction</MessageHeader>
                        <Bubble variant="tinted" align="end">
                          <BubbleContent>
                            Use compact billing cards, reduce CTA prominence,
                            and follow the existing pricing-card spacing.
                          </BubbleContent>
                        </Bubble>
                        <MessageFooter>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Copy correction"
                            >
                              <Copy className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Good result"
                            >
                              <ThumbsUp className="size-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              aria-label="Bad result"
                            >
                              <ThumbsDown className="size-3.5" />
                            </Button>
                          </div>
                        </MessageFooter>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                </>
              )}

              {liveStatus ? (
                <MessageScrollerItem>
                  <Marker variant="border">
                    <MarkerIcon>
                      <RefreshCcw className="text-[var(--codex-blue)]" />
                    </MarkerIcon>
                    <MarkerContent>{liveStatus}</MarkerContent>
                  </Marker>
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
                    <Marker variant="border">
                      <MarkerIcon>
                        <Sparkles className="text-[var(--codex-purple)]" />
                      </MarkerIcon>
                      <MarkerContent>
                        Living System learned compact-billing-card
                      </MarkerContent>
                    </Marker>
                  </MessageScrollerItem>
                  <MessageScrollerItem scrollAnchor>
                    <Message>
                      <MessageAvatar>
                        <Bot className="size-4" />
                      </MessageAvatar>
                      <MessageContent>
                        <Bubble variant="outline">
                          <BubbleContent>
                            Regenerated. Future billing prototypes now default
                            to compact cards and quieter checkout CTAs unless a
                            PM asks otherwise.
                          </BubbleContent>
                        </Bubble>
                        <MessageFooter>
                          System fit improved to 97%
                        </MessageFooter>
                      </MessageContent>
                    </Message>
                  </MessageScrollerItem>
                </>
              ) : null}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="border-t border-border/70 p-3">
        <div className="rounded-[1.35rem] border border-border bg-card p-3">
          <Textarea
            className="min-h-24 resize-none border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
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
            <Button variant="ghost" size="icon-sm" aria-label="Attach image">
              <ImagePlus className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 rounded-full"
              >
                <MessageSquare className="size-4" />
                Plan
              </Button>
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
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </div>
          {!hasLiveMessages ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mt-2 rounded-full px-2 text-xs text-muted-foreground"
            >
              <Link
                href={prototypeUrl({
                  sessionId: isBackendSession(prototype)
                    ? prototype.id
                    : undefined,
                  tab: activeTab,
                  learned: true,
                })}
                onClick={(event) => {
                  event.preventDefault();
                  onLearn();
                }}
              >
                Capture demo correction
              </Link>
            </Button>
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
    return `${PROTOTYPE_PREVIEW_ORIGIN}${prototype.routePath}/current`;
  }

  return null;
}

function PreviewCanvas({
  learned,
  previewUrl,
  prototype,
}: {
  learned: boolean;
  previewUrl: string | null;
  prototype?: PrototypeCardData | null;
}) {
  if (prototype && previewUrl) {
    return (
      <div className="flex h-full min-h-[560px] flex-col bg-card p-3 sm:p-4">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.1rem] border border-border bg-background">
          <div className="flex min-h-11 items-center justify-between border-b border-border bg-muted/30 px-4 text-sm">
            <div className="min-w-0">
              <div className="truncate font-semibold">{prototype.title}</div>
              <div className="truncate text-xs text-muted-foreground">
                {previewUrl}
              </div>
            </div>
            <Badge variant="outline" className="rounded-full bg-card">
              {prototype.sessionStatus}
            </Badge>
          </div>
          <iframe
            key={previewUrl}
            title={`${prototype.title} preview`}
            src={previewUrl}
            className="min-h-0 flex-1 border-0 bg-background"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-[560px] flex-col bg-card p-3 sm:p-4">
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-[1.1rem] border border-border bg-[oklch(0.985_0.006_255)] p-4">
        <div className="w-full max-w-5xl rounded-[1.25rem] border border-border bg-background shadow-[0_18px_70px_oklch(0.18_0.012_260_/_0.08)]">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div>
              <div className="text-sm font-semibold">Billing checkout</div>
              <div className="text-xs text-muted-foreground">
                {learned
                  ? "Second prototype, learned rule applied"
                  : "Initial prototype"}
              </div>
            </div>
            <Badge className="rounded-full bg-[oklch(0.9_0.075_274)] text-[oklch(0.32_0.13_270)] hover:bg-[oklch(0.9_0.075_274)]">
              System fit {learned ? "97%" : "94%"}
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

function SetupCanvas({ learned }: { learned: boolean }) {
  return (
    <div className="flex h-full min-h-[560px] items-center justify-center bg-card p-6">
      <div className="w-full max-w-3xl">
        <h3 className="text-2xl font-semibold tracking-tight">
          Set up prototype context
        </h3>
        <div className="mt-8 space-y-3">
          <div>
            <div className="text-lg font-semibold">Inputs</div>
            <p className="mt-1 text-sm text-muted-foreground">
              The working guide is inferred from code and reused for this
              prototype.
            </p>
          </div>
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="grid grid-cols-[0.8fr_1.2fr] border-b border-border bg-muted/35 px-4 py-3 text-sm font-medium">
              <span>Name</span>
              <span>Value</span>
            </div>
            {[
              ["Repo", "CaPheNao"],
              ["Route", "/billing/checkout"],
              ["System fit target", learned ? "97%" : "94%"],
              [
                "Learned rule",
                learned ? "compact-billing-card" : "pending correction",
              ],
            ].map(([name, value]) => (
              <div
                key={name}
                className="grid grid-cols-[0.8fr_1.2fr] border-b border-border/70 px-4 py-3 text-sm last:border-b-0"
              >
                <span className="text-muted-foreground">{name}</span>
                <span>{value}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button className="rounded-full">Save</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DesktopCanvas() {
  return (
    <div className="relative flex h-full min-h-[560px] items-center justify-center bg-[oklch(0.88_0.004_255)] text-sm font-medium text-muted-foreground">
      <Button
        variant="secondary"
        size="sm"
        className="absolute right-4 top-4 rounded-full"
      >
        Reload
      </Button>
      Connecting to desktop...
    </div>
  );
}

function ChangesCanvas({ learned }: { learned: boolean }) {
  return (
    <div className="h-full min-h-[560px] overflow-auto bg-card p-4">
      <div className="mb-3 flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
        <Badge variant="secondary" className="rounded-full font-mono">
          77bc7f2
        </Badge>
        <span className="text-muted-foreground">1mo</span>
      </div>
      <div className="space-y-6">
        {diffFiles.map((file) => (
          <section key={file.file}>
            <div className="flex items-center justify-between px-2 pb-2 text-sm font-semibold">
              <div className="flex min-w-0 items-center gap-2">
                <Plus className="size-4 rounded-full border border-[var(--live)] text-[var(--live)]" />
                <span className="truncate">{file.file}</span>
              </div>
              <span className="text-[var(--live)]">+{file.added}</span>
            </div>
            <div className="overflow-hidden rounded-lg bg-[oklch(0.94_0.035_168)] font-mono text-sm">
              {file.lines.map((line, index) => (
                <div key={line} className="grid grid-cols-[48px_1fr]">
                  <span className="bg-[oklch(0.9_0.045_170)] px-3 py-1.5 text-right text-[oklch(0.54_0.12_168)]">
                    {index + 1}
                  </span>
                  <code className="min-w-0 truncate px-3 py-1.5 text-[oklch(0.36_0.12_155)]">
                    {line}
                  </code>
                </div>
              ))}
            </div>
          </section>
        ))}
        {learned ? (
          <Marker className="rounded-xl border border-[oklch(0.72_0.09_270)] bg-[oklch(0.95_0.035_274)] p-3 text-foreground">
            <MarkerIcon>
              <Sparkles className="text-[var(--codex-purple)]" />
            </MarkerIcon>
            <MarkerContent>
              Added reusable Living System rule for compact billing cards.
            </MarkerContent>
          </Marker>
        ) : null}
      </div>
    </div>
  );
}

function LogsCanvas({ learned }: { learned: boolean }) {
  const logs = learned ? [...learnedLogs, ...baseLogs] : baseLogs;

  return (
    <div className="flex h-full min-h-[560px] flex-col bg-card p-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 rounded-full bg-background pl-11"
            placeholder="Search logs"
          />
        </div>
        <Button variant="secondary" className="rounded-full">
          All sources
          <ChevronDown className="size-4" />
        </Button>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Copy className="size-4" />
        </Button>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-border">
        <div className="grid grid-cols-[160px_160px_1fr] border-b border-border bg-muted/45 px-4 py-3 text-sm font-semibold">
          <span>Time</span>
          <span>Source</span>
          <span>Message</span>
        </div>
        <div className="divide-y divide-border/70">
          {logs.map(([time, source, message]) => (
            <div
              key={`${time}-${message}`}
              className="grid grid-cols-[160px_160px_1fr] px-4 py-3 font-mono text-sm"
            >
              <span>{time}</span>
              <span>{source}</span>
              <span className="truncate">{message}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkspaceCanvas({
  activeTab,
  learned,
  previewUrl,
  prototype,
}: {
  activeTab: WorkspaceTab;
  learned: boolean;
  previewUrl: string | null;
  prototype: PrototypeCardData;
}) {
  if (activeTab === "Setup") {
    return <SetupCanvas learned={learned} />;
  }

  if (activeTab === "Desktop") {
    return <DesktopCanvas />;
  }

  if (activeTab === "Changes") {
    return <ChangesCanvas learned={learned} />;
  }

  if (activeTab === "Logs") {
    return <LogsCanvas learned={learned} />;
  }

  return (
    <PreviewCanvas
      learned={learned}
      previewUrl={previewUrl}
      prototype={prototype}
    />
  );
}

function PrototypeWorkspace({
  chatError,
  chatMessages,
  chatPrompt,
  initialLearned = false,
  initialTab = "Preview",
  liveStatus,
  onChatPromptChange,
  onChatPromptSubmit,
  prototype,
  onBack,
  sendingPrompt,
}: {
  chatError: string | null;
  chatMessages: ChatMessageData[];
  chatPrompt: string;
  initialLearned?: boolean;
  initialTab?: WorkspaceTab;
  liveStatus: string | null;
  onChatPromptChange: (value: string) => void;
  onChatPromptSubmit: () => void;
  prototype: PrototypeCardData;
  onBack: () => void;
  sendingPrompt: boolean;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [learned, setLearned] = useState(initialLearned);
  const [chatOpen, setChatOpen] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const previewUrl = resolvePrototypePreviewUrl(prototype);
  const detailSessionId = isBackendSession(prototype)
    ? prototype.id
    : undefined;

  const correctionHandler = () => {
    setLearned(true);
    syncWorkspaceUrl({
      sessionId: detailSessionId,
      tab: activeTab,
      learned: true,
    });
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[oklch(0.968_0.004_255)]">
      <WorkspaceSidebarOverlay
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <WorkspaceChrome
        activeTab={activeTab}
        chatOpen={chatOpen}
        learned={learned}
        previewUrl={previewUrl}
        prototype={prototype}
        onBack={onBack}
        onToggleSidebar={() => setSidebarOpen((value) => !value)}
        onToggleChat={() => setChatOpen((value) => !value)}
        onTabChange={setActiveTab}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden p-2 lg:flex-row">
        <div
          className={cn(
            "h-[42vh] min-h-[360px] overflow-hidden rounded-[1rem] border border-border bg-background shadow-sm lg:h-full",
            !chatOpen && "hidden lg:block",
          )}
        >
          <ChatRail
            activeTab={activeTab}
            errorMessage={chatError}
            learned={learned}
            liveStatus={liveStatus}
            messages={chatMessages}
            onLearn={correctionHandler}
            onPromptChange={onChatPromptChange}
            onPromptSubmit={onChatPromptSubmit}
            prompt={chatPrompt}
            prototype={prototype}
            sendingPrompt={sendingPrompt}
          />
        </div>
        <main className="min-h-0 flex-1 overflow-auto rounded-[1rem] border border-border bg-card shadow-sm">
          <WorkspaceCanvas
            activeTab={activeTab}
            learned={learned}
            previewUrl={previewUrl}
            prototype={prototype}
          />
        </main>
      </div>
    </div>
  );
}

function AppShell() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceSummary | null>(null);
  const [prompt, setPrompt] = useState("");
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  const [sessionCards, setSessionCards] = useState<PrototypeCardData[]>([]);

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
        setLoadingError(null);
        const [workspaceResponse, sessionsResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/workspace`, { cache: "no-store" }),
          fetch(`${API_BASE_URL}/sessions`, { cache: "no-store" }),
        ]);

        if (!workspaceResponse.ok) {
          throw new Error(
            `Workspace request failed with ${workspaceResponse.status}`,
          );
        }

        if (!sessionsResponse.ok) {
          throw new Error(
            `Sessions request failed with ${sessionsResponse.status}`,
          );
        }

        const workspacePayload =
          (await workspaceResponse.json()) as WorkspaceSummary;
        const sessionsPayload =
          (await sessionsResponse.json()) as SessionListResponse;

        if (cancelled) {
          return;
        }

        setWorkspace(workspacePayload);
        setSessionCards(sessionsPayload.items.map(sessionToPrototypeCard));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setLoadingError(
          error instanceof Error ? error.message : "Failed to load workspace",
        );
      }
    }

    void loadDashboardData();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateSession() {
    const title = prompt.trim();

    if (!title || creatingSession) {
      return;
    }

    try {
      setCreatingSession(true);
      setLoadingError(null);
      const response = await fetch(`${API_BASE_URL}/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      if (!response.ok) {
        throw new Error(`Create session failed with ${response.status}`);
      }

      const payload = (await response.json()) as CreateSessionResponse;
      const nextCard = sessionToPrototypeCard(payload);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(`pending-prompt:${payload.id}`, title);
      }
      setSessionCards((current) => [nextCard, ...current]);
      setPrompt("");
      router.push(prototypeUrl({ sessionId: payload.id, tab: "Preview" }));
    } catch (error) {
      setLoadingError(
        error instanceof Error ? error.message : "Failed to create session",
      );
    } finally {
      setCreatingSession(false);
    }
  }

  const recentSessionCards = useMemo(
    () => sessionCards.slice(0, 8),
    [sessionCards],
  );

  return (
    <main className="h-screen overflow-hidden bg-[oklch(0.965_0_0)] text-foreground">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[280px] bg-[oklch(0.965_0_0)] px-3 py-4 text-sidebar-foreground lg:flex lg:flex-col">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <Avatar className="size-7 border border-border">
              <AvatarFallback className="bg-[oklch(0.86_0.045_255)] text-xs font-semibold text-[oklch(0.28_0.08_270)]">
                A
              </AvatarFallback>
            </Avatar>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 px-1.5">
                  {workspace?.name ?? "Archetype"}
                  <ChevronDown className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem>Switch workspace</DropdownMenuItem>
                <DropdownMenuItem>Invite teammate</DropdownMenuItem>
                <DropdownMenuItem>Workspace settings</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Collapse sidebar">
            <PanelLeft className="size-4" />
          </Button>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 rounded-full border-transparent bg-background/65 pl-9 shadow-none"
            placeholder="Search"
          />
        </div>

        <nav className="mt-3 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Prototypes" active />
        </nav>

        <div className="mt-5 flex items-center justify-between px-2 text-sm font-medium text-muted-foreground">
          Recent
          <ChevronDown className="size-4" />
        </div>
        <div className="mt-2 space-y-1">
          {recentSessionCards.length > 0 ? (
            recentSessionCards.map((card) => (
              <Button
                key={card.id}
                variant="ghost"
                className="h-8 w-full justify-start gap-2 truncate rounded-xl px-3 text-[0.85rem]"
                onClick={() => handleSelectPrototype(card)}
              >
                <span className="size-2 rounded-full bg-[var(--codex-blue)]" />
                <span className="truncate">{card.title}</span>
              </Button>
            ))
          ) : (
            <p className="px-3 py-2 text-xs text-muted-foreground">
              No sessions yet.
            </p>
          )}
        </div>

        <div className="mt-auto rounded-2xl bg-background/45 p-3">
          <div className="flex items-center gap-2 text-xs font-medium">
            <BadgeCheck className="size-3.5 text-[var(--codex-purple)]" />
            Project guide ready
          </div>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Inferred from the connected repo, no design-system cleanup required.
          </p>
        </div>
      </aside>

      <section className="flex h-screen min-w-0 flex-col lg:pl-[280px]">
        <header className="fixed inset-x-0 top-0 z-20 flex h-16 shrink-0 items-center justify-between bg-[oklch(0.965_0_0)] px-4 sm:px-6 lg:left-[280px]">
          <div className="flex min-w-0 items-center gap-3">
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden"
              aria-label="Open sidebar"
            >
              <PanelLeft className="size-4" />
            </Button>
            <h1 className="truncate text-lg font-semibold tracking-tight">
              Prototypes
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <ToolButton label="Activity" icon={History} />
            <ToolButton label="Notifications" icon={Bell} />
            <ToolButton label="Settings" icon={Settings2} />
          </div>
        </header>

        <div className="min-h-0 flex-1 pt-16">
          <div className="h-full overflow-hidden rounded-tl-[24px] border-l border-t border-border/80 bg-card/75">
            <DashboardView
              creatingSession={creatingSession}
              errorMessage={loadingError}
              onCreateSession={handleCreateSession}
              onPromptChange={setPrompt}
              onSelectPrototype={handleSelectPrototype}
              prompt={prompt}
              prototypeCards={sessionCards}
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

  return <AppShell />;
}

export function PrototypeDetailClient({
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
  const [chatPrompt, setChatPrompt] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);
  const [chatError, setChatError] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string | null>(null);
  const [sendingPrompt, setSendingPrompt] = useState(false);

  const patchPrototype = useCallback(
    (updater: (card: PrototypeCardData) => PrototypeCardData) => {
      setPrototype((current) => (current ? updater(current) : current));
    },
    [],
  );

  const submitPromptForDetail = useCallback(
    async (content: string) => {
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
        await submitSessionPrompt(sessionId, trimmedContent);
        patchPrototype((card) => ({
          ...card,
          status: "Draft",
          sessionStatus: "processing",
        }));
        setLiveStatus("processing");
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

    if (!content || sendingPrompt) {
      return;
    }

    setChatPrompt("");
    void submitPromptForDetail(content);
  }, [chatPrompt, sendingPrompt, submitPromptForDetail]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const detailSessionId = sessionId;
    let cancelled = false;
    const eventSource = new EventSource(
      `${API_BASE_URL}/sessions/${detailSessionId}/events`,
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
        chatError={chatError}
        chatMessages={chatMessages}
        chatPrompt={chatPrompt}
        initialLearned={initialWorkspace.learned}
        initialTab={initialWorkspace.tab}
        liveStatus={liveStatus}
        onChatPromptChange={setChatPrompt}
        onChatPromptSubmit={handlePromptSubmit}
        prototype={prototype}
        onBack={() => router.push("/")}
        sendingPrompt={sendingPrompt}
      />
    </main>
  );
}
