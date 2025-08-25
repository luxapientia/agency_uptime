export interface Worker {
  workerId: string;
  region: string;
  startedAt: string;
  lastHeartbeat: string;
  activeSites: number;
}

export interface WorkersResponse {
  success: boolean;
  data: {
    workers: Worker[];
    count: number;
  };
}

export interface WorkerIdsResponse {
  success: boolean;
  data: {
    workerIds: string[];
    count: number;
  };
}

export interface WorkerState {
  workers: Worker[];
  workerIds: string[];
  isLoading: boolean;
  error: string | null;
} 