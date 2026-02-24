import { useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { useTableStore } from '../store/tableStore';
import { BilliardTable } from '../types';

const HUB_URL = import.meta.env.VITE_HUB_URL || 'http://localhost:5001/hubs/tables';

export function useSignalR() {
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  const updateTableStatus = useTableStore((s) => s.updateTableStatus);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token || '' })
      .withAutomaticReconnect()
      .build();

    connection.on('TableStatusChanged', (tableId: string, status: BilliardTable['status']) => {
      updateTableStatus(tableId, status);
    });

    connection.start().catch(console.error);
    connectionRef.current = connection;

    return () => { connection.stop(); };
  }, [updateTableStatus]);

  return connectionRef;
}
