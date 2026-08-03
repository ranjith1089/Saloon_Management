import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Loader2, Save, ShieldCheck, Info } from 'lucide-react';
import api from '@/services/api';

interface Permission {
  id: string;
  key: string;
  label: string;
  category: string;
  grantedTo: string[];
}
interface Matrix {
  roles: string[];
  permissions: Permission[];
}

export default function AccessControl() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['permission-matrix'],
    queryFn: async () => (await api.get('/access-control/matrix')).data.data as Matrix,
  });

  // Local editable state — copied from server response, dirty until saved.
  const [grants, setGrants] = useState<Record<string, Set<string>>>({});
  const [initial, setInitial] = useState<Record<string, Set<string>>>({});

  useEffect(() => {
    if (!data) return;
    const map: Record<string, Set<string>> = {};
    data.permissions.forEach((p) => (map[p.id] = new Set(p.grantedTo)));
    setGrants(map);
    setInitial(JSON.parse(JSON.stringify(Object.fromEntries(
      Object.entries(map).map(([k, v]) => [k, Array.from(v)])
    ))));
  }, [data]);

  const isDirty = useMemo(() => {
    const keys = Object.keys(grants);
    if (keys.length === 0) return false;
    for (const k of keys) {
      const a = Array.from(grants[k] || []).sort();
      const b = ((initial as any)[k] || []).slice().sort();
      if (a.length !== b.length || a.some((x, i) => x !== b[i])) return true;
    }
    return false;
  }, [grants, initial]);

  const toggle = (permissionId: string, role: string) => {
    if (role === 'ADMIN') return; // ADMIN locked
    setGrants((prev) => {
      const next = { ...prev, [permissionId]: new Set(prev[permissionId] || []) };
      if (next[permissionId].has(role)) next[permissionId].delete(role);
      else next[permissionId].add(role);
      return next;
    });
  };

  const save = useMutation({
    mutationFn: async () => {
      const items = Object.entries(grants).map(([permissionId, roles]) => ({
        permissionId,
        roles: Array.from(roles),
      }));
      return api.put('/access-control/matrix', { items });
    },
    onSuccess: () => {
      toast.success('Permissions updated');
      queryClient.invalidateQueries({ queryKey: ['permission-matrix'] });
      queryClient.invalidateQueries({ queryKey: ['me-permissions'] });
    },
  });

  if (isLoading || !data) {
    return <div className="card text-center py-8 text-gray-500">Loading…</div>;
  }

  // Group permissions by category for display.
  const byCategory: Record<string, Permission[]> = {};
  data.permissions.forEach((p) => {
    (byCategory[p.category] ||= []).push(p);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-6 h-6" /> Access Control
          </h1>
          <p className="text-sm text-gray-500 mt-1">Grant or revoke fine-grained permissions per role</p>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={!isDirty || save.isPending}
          className="btn-primary inline-flex items-center gap-1"
        >
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      <div className="card bg-blue-50 border border-blue-100 flex items-start gap-2 text-sm text-blue-900">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-medium">ADMIN always has everything.</p>
          <p className="text-xs mt-0.5">
            ADMIN column is locked — if you accidentally revoked all ADMIN permissions no one could log back in. Toggle MANAGER and STAFF as needed. Changes take effect within a minute.
          </p>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700 w-1/2">Permission</th>
                {data.roles.map((role) => (
                  <th key={role} className="text-center px-4 py-3 font-medium text-gray-700 whitespace-nowrap">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(byCategory).map(([category, perms]) => (
                <>
                  <tr key={`h-${category}`} className="bg-gray-50">
                    <td colSpan={1 + data.roles.length} className="px-4 py-2 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      {category}
                    </td>
                  </tr>
                  {perms.map((p) => (
                    <tr key={p.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2">
                        <div className="font-medium">{p.label}</div>
                        <div className="text-[11px] text-gray-500 font-mono">{p.key}</div>
                      </td>
                      {data.roles.map((role) => (
                        <td key={role} className="text-center px-4 py-2">
                          <input
                            type="checkbox"
                            checked={grants[p.id]?.has(role) ?? false}
                            disabled={role === 'ADMIN'}
                            onChange={() => toggle(p.id, role)}
                            className="w-4 h-4 disabled:opacity-70"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isDirty && (
        <div className="sticky bottom-4 bg-white border border-primary-200 shadow-lg rounded-lg p-3 flex items-center justify-between">
          <span className="text-sm text-gray-600">Unsaved changes</span>
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="btn-primary inline-flex items-center gap-1"
          >
            {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      )}
    </div>
  );
}
