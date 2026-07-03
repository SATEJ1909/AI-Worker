'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Integration {
  id: string;
  provider: string;
  accountEmail: string | null;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  integrations: Integration[];
}

interface WorkspaceContextType {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  isLoading: boolean;
  error: string | null;
  setActiveWorkspaceId: (id: string) => void;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
}

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/workspaces`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.status === 401) {
        // Token expired or invalid — clear auth state and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('activeWorkspaceId');
        window.location.href = '/sign-in';
        return;
      }

      if (!res.ok) {
        throw new Error(`Failed to fetch workspaces (${res.status})`);
      }

      const data = await res.json();
      
      if (data.success && data.workspaces) {
        setWorkspaces(data.workspaces);
        
        // Handle active workspace selection
        if (data.workspaces.length > 0) {
          const storedWorkspaceId = localStorage.getItem('activeWorkspaceId');
          const isValidStored = data.workspaces.some((ws: Workspace) => ws.id === storedWorkspaceId);
          
          if (isValidStored && storedWorkspaceId) {
            setActiveWorkspaceIdState(storedWorkspaceId);
          } else {
            // Default to first workspace if nothing stored or stored is invalid
            setActiveWorkspaceIdState(data.workspaces[0].id);
            localStorage.setItem('activeWorkspaceId', data.workspaces[0].id);
          }
        } else {
          setActiveWorkspaceIdState(null);
          localStorage.removeItem('activeWorkspaceId');
        }
      }
    } catch (err: any) {
      console.error('Error fetching workspaces:', err);
      setError(err.message || 'An error occurred while fetching workspaces');
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkspace = async (name: string): Promise<Workspace> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/workspaces`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to create workspace');
    }

    await fetchWorkspaces();
    return data.workspace;
  };

  const deleteWorkspace = async (id: string): Promise<void> => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('Not authenticated');

    const res = await fetch(`${API_BASE}/workspaces/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to delete workspace');
    }

    if (activeWorkspaceId === id) {
      setActiveWorkspaceIdState(null);
      localStorage.removeItem('activeWorkspaceId');
    }
    await fetchWorkspaces();
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const setActiveWorkspaceId = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (ws) {
      setActiveWorkspaceIdState(id);
      localStorage.setItem('activeWorkspaceId', id);
    }
  };

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null;

  return (
    <WorkspaceContext.Provider 
      value={{ 
        workspaces, 
        activeWorkspace, 
        isLoading, 
        error, 
        setActiveWorkspaceId, 
        refreshWorkspaces: fetchWorkspaces,
        createWorkspace,
        deleteWorkspace
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
