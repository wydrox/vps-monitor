import { authenticatedFetch } from "@/lib/api-client";
import { API_BASE_URL } from "@/types/api";

export interface ContainerHistoryStats {
  cpu_1h: number;
  memory_1h: number;
  cpu_12h: number;
  memory_12h: number;
}

export async function getContainerHistory(id: string): Promise<ContainerHistoryStats> {
  const endpoint = `${API_BASE_URL}/api/v1/containers/${id}/stats/history`;
  const response = await authenticatedFetch(endpoint);

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<ContainerHistoryStats>;
}
