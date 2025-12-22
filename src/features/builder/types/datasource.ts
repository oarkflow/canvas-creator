// Types for data sources

export type DataSourceType = 'static-json' | 'key-value' | 'http-api';

export interface HttpConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers: Record<string, string>;
  body?: string;
  queryParams?: Record<string, string>;
}

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  // For static-json: raw JSON string
  jsonData?: string;
  // For key-value: simple key-value pairs
  keyValueData?: Record<string, string>;
  // For http-api: endpoint configuration
  httpConfig?: HttpConfig;
  // Cached response data
  cachedData?: unknown;
  lastFetched?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceStore {
  dataSources: DataSource[];
  addDataSource: (ds: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>) => DataSource;
  updateDataSource: (id: string, updates: Partial<DataSource>) => void;
  deleteDataSource: (id: string) => void;
  getDataSource: (id: string) => DataSource | undefined;
  fetchHttpData: (id: string) => Promise<unknown>;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}
