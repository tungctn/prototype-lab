import { PrototypeDetailClient, type InitialWorkspaceState } from "../../home-client";

const workspaceTabs = ["Setup", "Preview", "Desktop", "Changes", "Logs"] as const;

type WorkspaceTab = (typeof workspaceTabs)[number];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeTab(value: string | undefined): WorkspaceTab {
  const match = workspaceTabs.find(
    (tab) => tab.toLowerCase() === value?.toLowerCase()
  );

  return match ?? "Preview";
}

function parseWorkspaceState(
  params: Record<string, string | string[] | undefined>
): InitialWorkspaceState {
  return {
    learned: firstParam(params.learned) === "1",
    prototype: null,
    tab: normalizeTab(firstParam(params.tab)),
  };
}

export default async function SessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ sessionId }, resolvedSearchParams] = await Promise.all([
    params,
    searchParams,
  ]);

  return (
    <PrototypeDetailClient
      initialWorkspace={parseWorkspaceState(resolvedSearchParams)}
      sessionId={sessionId}
    />
  );
}
