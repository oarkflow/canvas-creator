import { create } from 'zustand';
import { DataSource, DataSourceStore } from '@/features/builder/types/datasource';

const STORAGE_KEY = 'builder-datasources';

export const useDataSourceStore = create<DataSourceStore>((set, get) => ({
  dataSources: [],

  addDataSource: (ds) => {
    const newDs: DataSource = {
      ...ds,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => {
      const updated = [...state.dataSources, newDs];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { dataSources: updated };
    });
    return newDs;
  },

  updateDataSource: (id, updates) => {
    set((state) => {
      const updated = state.dataSources.map((ds) =>
        ds.id === id ? { ...ds, ...updates, updatedAt: new Date().toISOString() } : ds
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { dataSources: updated };
    });
  },

  deleteDataSource: (id) => {
    set((state) => {
      const updated = state.dataSources.filter((ds) => ds.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { dataSources: updated };
    });
  },

  getDataSource: (id) => {
    return get().dataSources.find((ds) => ds.id === id);
  },

  fetchHttpData: async (id) => {
    const ds = get().getDataSource(id);
    if (!ds || ds.type !== 'http-api' || !ds.httpConfig) {
      return null;
    }

    try {
      const { url, method, headers, body, queryParams } = ds.httpConfig;
      
      let finalUrl = url;
      if (queryParams && Object.keys(queryParams).length > 0) {
        const params = new URLSearchParams(queryParams);
        finalUrl = `${url}?${params.toString()}`;
      }

      const response = await fetch(finalUrl, {
        method,
        headers: headers || {},
        body: method !== 'GET' && body ? body : undefined,
      });

      const data = await response.json();
      
      get().updateDataSource(id, {
        cachedData: data,
        lastFetched: new Date().toISOString(),
      });

      return data;
    } catch (error) {
      console.error('Failed to fetch HTTP data:', error);
      return null;
    }
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as DataSource[];
        set({ dataSources: parsed });
      }
    } catch (error) {
      console.error('Failed to load data sources from storage:', error);
    }
  },

  saveToStorage: () => {
    const { dataSources } = get();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataSources));
  },
}));
