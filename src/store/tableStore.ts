import { create } from 'zustand';
import type { BilliardTable } from '../types';

interface TableState {
  tables: BilliardTable[];
  setTables: (tables: BilliardTable[]) => void;
  updateTableStatus: (tableId: string, status: BilliardTable['status']) => void;
}

export const useTableStore = create<TableState>((set) => ({
  tables: [],
  setTables: (tables) => set({ tables }),
  updateTableStatus: (tableId, status) =>
    set((state) => ({
      tables: state.tables.map((t) =>
        t.id === tableId ? { ...t, status } : t
      ),
    })),
}));
