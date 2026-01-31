import { Fragment } from "react";
import { ActivityIcon, ChevronDown, ChevronRight, FileTextIcon, PlayIcon, RotateCwIcon, SquareIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { useContainerHistory } from "../hooks/use-container-history";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import {
  formatContainerName,
  formatCreatedDate,
  formatUptime,
  getStateBadgeClass,
  toTitleCase,
} from "./container-utils";

import type { ContainerInfo } from "../types";
import type {
  ContainerActionType,
  GroupByOption,
  GroupedContainers,
} from "./container-utils";

interface ContainerRowProps {
  container: ContainerInfo;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  pendingAction: { id: string; type: ContainerActionType } | null;
  isReadOnly: boolean;
  onStart: (container: ContainerInfo) => void;
  onStop: (container: ContainerInfo) => void;
  onRestart: (container: ContainerInfo) => void;
  onDelete: (container: ContainerInfo) => void;
  onViewLogs: (container: ContainerInfo) => void;
  onViewStats: (container: ContainerInfo) => void;
}

function ContainerRow({
  container,
  selectedIds,
  onToggleSelect,
  pendingAction,
  isReadOnly,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onViewLogs,
  onViewStats,
}: ContainerRowProps) {
  const { data: history, isLoading: isHistoryLoading } = useContainerHistory(container.id);
  
  const isContainerActionPending = (
    action: ContainerActionType,
    containerId: string
  ) =>
    pendingAction?.id === containerId && pendingAction.type === action;

  const isContainerBusy = (containerId: string) =>
    pendingAction?.id === containerId;

  const state = container.state.toLowerCase();
  const busy = isContainerBusy(container.id);
  const startPending = isContainerActionPending("start", container.id);
  const stopPending = isContainerActionPending("stop", container.id);
  const restartPending = isContainerActionPending("restart", container.id);
  const removePending = isContainerActionPending("remove", container.id);

  const renderStats = (cpu?: number, mem?: number) => {
    if (cpu === undefined || mem === undefined) return "—";
    return (
      <div className="flex flex-col text-xs leading-tight">
        <span className="whitespace-nowrap">CPU {cpu.toFixed(1)}%</span>
        <span className="whitespace-nowrap">RAM {mem.toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="h-16 px-4 w-12">
        <Checkbox
          checked={selectedIds.includes(container.id)}
          onCheckedChange={() => onToggleSelect(container.id)}
        />
      </TableCell>
      <TableCell className="h-16 px-4 font-medium">
        {formatContainerName(container.names)}
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        <button
          onClick={async () => {
            await navigator.clipboard.writeText(container.image);
            toast.success("Image name copied to clipboard");
          }}
          className="text-left hover:underline cursor-pointer hover:text-foreground transition-colors max-w-full truncate block"
          title={container.image}
        >
          {container.image.length > 40
            ? `${container.image.substring(0, 37)}...`
            : container.image}
        </button>
      </TableCell>
      <TableCell className="h-16 px-4">
        <Badge
          className={`${getStateBadgeClass(container.state)} border-0`}
        >
          {toTitleCase(container.state)}
        </Badge>
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        {formatUptime(container.created)}
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground">
        {formatCreatedDate(container.created)}
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground w-[120px]">
        {isHistoryLoading ? (
           <span className="text-xs text-muted-foreground/50">Loading...</span>
        ) : history ? (
          renderStats(history.cpu_1h, history.memory_1h)
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </TableCell>
      <TableCell className="h-16 px-4 text-sm text-muted-foreground w-[120px]">
        {isHistoryLoading ? (
           <span className="text-xs text-muted-foreground/50">Loading...</span>
        ) : history ? (
          renderStats(history.cpu_12h, history.memory_12h)
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </TableCell>
      <TableCell className="h-16 px-4 max-w-[300px] text-sm text-muted-foreground">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="block cursor-help truncate">
                {container.command}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-md">
              {container.command}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell className="h-16 px-4">
        <TooltipProvider>
          <div className="flex items-center gap-1">
            {state === "exited" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onStart(container)}
                      disabled={busy || isReadOnly}
                    >
                      {startPending ? (
                        <Spinner className="size-4" />
                      ) : (
                        <PlayIcon className="size-4" />
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {isReadOnly ? "Start (Read-only mode)" : "Start"}
                </TooltipContent>
              </Tooltip>
            )}
            {state === "running" && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-block">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onStop(container)}
                      disabled={busy || isReadOnly}
                    >
                      {stopPending ? (
                        <Spinner className="size-4" />
                      ) : (
                        <SquareIcon className="size-4" />
                      )}
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  {isReadOnly ? "Stop (Read-only mode)" : "Stop"}
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onRestart(container)}
                    disabled={busy || isReadOnly}
                  >
                    {restartPending ? (
                      <Spinner className="size-4" />
                    ) : (
                      <RotateCwIcon className="size-4" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isReadOnly ? "Restart (Read-only mode)" : "Restart"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-block">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive hover:text-white"
                    onClick={() => onDelete(container)}
                    disabled={busy || isReadOnly}
                  >
                    {removePending ? (
                      <Spinner className="size-4" />
                    ) : (
                      <Trash2Icon className="size-4" />
                    )}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {isReadOnly ? "Delete (Read-only mode)" : "Delete"}
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onViewLogs(container)}
                  disabled={busy}
                >
                  <FileTextIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Logs</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onViewStats(container)}
                  disabled={busy}
                >
                  <ActivityIcon className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>View Stats</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </TableCell>
    </TableRow>
  );
}

export function ContainersTable({
  isLoading,
  isError,
  error,
  groupBy,
  filteredContainers,
  groupedItems,
  pageItems,
  pendingAction,
  isReadOnly,
  expandedGroups,
  selectedIds,
  onToggleSelect,
  onSelectAll,
  onToggleGroup,
  onStart,
  onStop,
  onRestart,
  onDelete,
  onViewLogs,
  onViewStats,
  onRetry,
}: ContainersTableProps) {
  const renderRow = (container: ContainerInfo) => (
    <ContainerRow
      key={container.id}
      container={container}
      selectedIds={selectedIds}
      onToggleSelect={onToggleSelect}
      pendingAction={pendingAction}
      isReadOnly={isReadOnly}
      onStart={onStart}
      onStop={onStop}
      onRestart={onRestart}
      onDelete={onDelete}
      onViewLogs={onViewLogs}
      onViewStats={onViewStats}
    />
  );

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b">
            <TableHead className="h-12 px-4 w-12">
              <Checkbox
                checked={selectedIds.length > 0 && selectedIds.length === pageItems.length}
                onCheckedChange={onSelectAll}
              />
            </TableHead>
            <TableHead className="h-12 px-4 font-medium">Name</TableHead>
            <TableHead className="h-12 px-4 font-medium">Image</TableHead>
            <TableHead className="h-12 px-4 font-medium w-[120px]">
              State
            </TableHead>
            <TableHead className="h-12 px-4 font-medium">Uptime</TableHead>
            <TableHead className="h-12 px-4 font-medium">Created</TableHead>
            <TableHead className="h-12 px-4 font-medium w-[120px]">Avg 1h</TableHead>
            <TableHead className="h-12 px-4 font-medium w-[120px]">Avg 12h</TableHead>
            <TableHead className="h-12 px-4 font-medium">Command</TableHead>
            <TableHead className="h-12 px-4 font-medium w-[160px]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={10} className="h-32">
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Spinner className="mr-2" />
                  Loading containers…
                </div>
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={10} className="h-32">
                <div className="flex flex-col items-center gap-3 text-center">
                  <p className="text-sm text-muted-foreground">
                    {(error as Error)?.message || "Unable to load containers."}
                  </p>
                  <Button size="sm" variant="outline" onClick={onRetry}>
                    Try again
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : filteredContainers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="h-32">
                <div className="text-center text-sm text-muted-foreground">
                  No containers found.
                </div>
              </TableCell>
            </TableRow>
          ) : groupBy === "compose" && groupedItems ? (
            groupedItems.map((group) => {
              const isExpanded = expandedGroups.includes(group.project);
              return (
                <Fragment key={group.project}>
                  <TableRow 
                    className="bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onToggleGroup(group.project)}
                  >
                    <TableCell
                      colSpan={10}
                      className="h-10 px-4 text-xs font-medium text-muted-foreground"
                    >
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 transition-transform" />
                        ) : (
                          <ChevronRight className="h-4 w-4 transition-transform" />
                        )}
                        <span>
                          {group.project} · {group.items.length} container
                          {group.items.length === 1 ? "" : "s"}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && group.items.map(renderRow)}
                </Fragment>
              );
            })
          ) : (
            pageItems.map(renderRow)
          )}
        </TableBody>
      </Table>
    </div>
  );
}
