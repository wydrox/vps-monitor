import { useQuery } from "@tanstack/react-query";
import { getContainerHistory } from "../api/get-container-history";

export function useContainerHistory(id: string) {
  return useQuery({
    queryKey: ["container-history", id],
    queryFn: () => getContainerHistory(id),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: false,
  });
}
