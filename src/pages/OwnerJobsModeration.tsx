import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Trash2, Briefcase } from 'lucide-react';
import { AdminService, type AdminOwnerJobRow } from '../lib/admin/adminService';
import { useToast } from '../lib/toast/ToastContext';

function OwnerJobsModeration() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<AdminOwnerJobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AdminService.getOwnerJobsForAdmin();
      setRows(data);
    } catch (e) {
      console.error(e);
      showToast('Gesuche konnten nicht geladen werden.', 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openModal = (id: string) => {
    setActionId(id);
    setReason('');
  };

  const closeModal = () => {
    setActionId(null);
    setReason('');
  };

  const submitModal = async () => {
    if (!actionId) return;
    const r = reason.trim();
    if (r.length < 5) {
      showToast('Bitte einen verständlichen Grund angeben (mindestens 5 Zeichen).', 'error');
      return;
    }
    try {
      await AdminService.adminDeleteOwnerJob(actionId, r);
      showToast('Gesuch gelöscht. Der Tierhalter sieht den Hinweis im Dashboard unter „Gesuche“.', 'success');
      closeModal();
      void load();
    } catch (e: unknown) {
      console.error(e);
      const msg =
        e && typeof e === 'object' && 'message' in e
          ? String((e as { message: string }).message)
          : 'Aktion fehlgeschlagen';
      showToast(msg, 'error');
    }
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      open: 'Offen',
      closed: 'Geschlossen',
      filled: 'Vermittelt',
    };
    return map[s] || s;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gesuche (Tierhalter)</h1>
            <p className="text-sm text-gray-600">
              Gesuche endgültig löschen. Der Tierhalter erhält einen Hinweis mit Begründung im Bereich „Gesuche“.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Aktualisieren
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Lade Gesuche…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">Keine Gesuche gefunden.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Titel</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Tierhalter</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Ort</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Erstellt</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-medium text-gray-900 line-clamp-2" title={row.title}>
                      {row.title}
                    </div>
                    <div className="mt-1 text-xs text-gray-500 line-clamp-2" title={row.description}>
                      {row.description}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{row.users?.email || '—'}</div>
                    <div className="text-xs text-gray-500">
                      {[row.users?.first_name, row.users?.last_name].filter(Boolean).join(' ') || ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusLabel(row.status)}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[10rem] truncate" title={row.location_text || ''}>
                    {row.location_text || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString('de-DE')}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => openModal(row.id)}
                      className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-900 hover:bg-red-200"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Löschen
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {actionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Gesuch löschen</h2>
            <p className="mt-2 text-sm text-gray-600">
              Das Gesuch wird unwiderruflich entfernt. Der Tierhalter erhält einen Hinweis mit deiner Begründung im
              Dashboard (Tab „Gesuche“).
            </p>
            <label htmlFor="owner-job-mod-reason" className="mt-4 block text-sm font-medium text-gray-700">
              Begründung (mind. 5 Zeichen, sichtbar für den Nutzer)
            </label>
            <textarea
              id="owner-job-mod-reason"
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z. B. Verstoß gegen die Nutzungsbedingungen …"
            />
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={() => void submitModal()}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Endgültig löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OwnerJobsModeration;
