import { Fragment } from "react";
import { ActivityIcon, ArrowUpDown, ChevronDown, ChevronRight, ChevronUp, FileTextIcon, PlayIcon, RotateCwIcon, SquareIcon, Trash2Icon } from "lucide-react";
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
  SortDirection,
  SortColumn,
  StatsInterval,
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
  statsInterval: StatsInterval;
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
  statsInterval,
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

  const cpuValue = statsInterval === "1h" ? history?.cpu_1h : history?.cpu_12h;
  const memValue = statsInterval === "1h" ? history?.memory_1h : history?.memory_12h;

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell className="h-16 px-4 w-12">
        <Checkbox
          checked={selectedIds.includes(container.id)}
          onCheckedChange={() => onToggleSelect(container.id)}
        />
      </TableCell>
      <TableCell className="h-16 px-4">
        <div className="flex flex-col gap-1">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(formatContainerName(container.names));
              toast.success("Container name copied to clipboard");
            }}
            className="text-left font-medium hover:underline cursor-pointer transition-colors truncate max-w-[200px]"
            title={formatContainerName(container.names)}
          >
            {formatContainerName(container.names)}
          </button>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(container.image);
              toast.success("Image name copied to clipboard");
            }}
            className="text-left text-xs text-muted-foreground hover:underline cursor-pointer hover:text-foreground transition-colors truncate max-w-[200px]"
            title={container.image}
          >
            {container.image.length > 40
              ? `${container.image.substring(0, 37)}...`
              : container.image}
          </button>
        </div>
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
      {/* CPU Column */}
      <TableCell className="h-16 px-4 text-sm text-muted-foreground w-[100px]">
        {isHistoryLoading ? (
          <span className="text-xs text-muted-foreground/50">...</span>
        ) : cpuValue !== undefined ? (
          <span className={`font-medium ${cpuValue > 80 ? "text-destructive" : cpuValue > 50 ? "text-amber-500" : ""}`}>
            {cpuValue.toFixed(1)}%
          </span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
      </TableCell>
      {/* RAM Column */}
      <TableCell className="h-16 px-4 text-sm text-muted-foreground w-[100px]">
        {isHistoryLoading ? (
          <span className="text-xs text-muted-foreground/50">...</span>
        ) : memValue !== undefined ? (
          <span className={`font-medium ${memValue > 80 ? "text-destructive" : memValue > 50 ? "text-amber-500" : ""}`}>
            {memValue.toFixed(1)}%
          </span>
        ) : (
          <span className="text-muted-foreground/50">—</span>
        )}
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

interface ContainersTableProps {
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  groupBy: GroupByOption;
  filteredContainers: ContainerInfo[];
  groupedItems: GroupedContainers[] | null;
  pageItems: ContainerInfo[];
  pendingAction: { id: string; type: ContainerActionType } | null;
  isReadOnly: boolean;
  expandedGroups: string[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onSelectAll: () => void;
  onToggleGroup: (groupName: string) => void;
  onStart: (container: ContainerInfo) => void;
  onStop: (container: ContainerInfo) => void;
  onRestart: (container: ContainerInfo) => void;
  onDelete: (container: ContainerInfo) => void;
  onViewLogs: (container: ContainerInfo) => void;
  onViewStats: (container: ContainerInfo) => void;
  onRetry: () => void;
  statsInterval: StatsInterval;
  sortBy: SortColumn;
  sortDirection: SortDirection;
  onSortChange: (column: SortColumn) => void;
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
  statsInterval,
  sortBy,
  sortDirection,
  onSortChange,
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
      statsInterval={statsInterval}
    />
  );

  const SortHeader = ({ 
    column, 
    children, 
    className = "" 
  }: { 
    column: SortColumn; 
    children: React.ReactNode; 
    className?: string;
  }) => {
    const isActive = sortBy === column;
    const Icon = isActive 
      ? (sortDirection === "desc" ? ChevronDown : ChevronUp)
      : ArrowUpDown;
    
    return (
      <TableHead 
        className={`h-12 px-4 font-medium cursor-pointer hover:bg-muted/50 transition-colors ${className}`}
        onClick={() => onSortChange(column)}
      >
        <div className="flex items-center gap-1">
          {children}
          <Icon className={`size-4 ${isActive ? "text-foreground" : "text-muted-foreground/50"}`} />
        </div>
      </TableHead>
    );
  };

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
            <SortHeader column="name">Container</SortHeader>
            <SortHeader column="state" className="w-[120px]">State</SortHeader>
            <SortHeader column="uptime">Uptime</SortHeader>
            <SortHeader column="created">Created</SortHeader>
            <SortHeader column="cpu" className="w-[100px]">CPU</SortHeader>
            <SortHeader column="ram" className="w-[100px]">RAM</SortHeader>
            <TableHead className="h-12 px-4 font-medium w-[160px]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32">
                <div className="flex items-center justify-center text-sm text-muted-foreground">
                  <Spinner className="mr-2" />
                  Loading containers…
                </div>
              </TableCell>
            </TableRow>
          ) : isError ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32">
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
              <TableCell colSpan={8} className="h-32">
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
                      colSpan={8}
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
