import { PrototypeDetailClient, type InitialWorkspaceState } from "../home-client";

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
    prototype: "checkout",
    tab: normalizeTab(firstParam(params.tab)),
  };
}

export default async function DetailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <PrototypeDetailClient
      initialWorkspace={parseWorkspaceState(await searchParams)}
    />
  );
}
