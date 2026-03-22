import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Ban, Trash2, Store } from 'lucide-react';
import { AdminService, type AdminMarketplaceListing } from '../lib/admin/adminService';
import { useToast } from '../lib/toast/ToastContext';

function MarketplaceModeration() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<AdminMarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [modal, setModal] = useState<'deactivate' | 'delete' | null>(null);
  const [reason, setReason] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await AdminService.getMarketplaceListingsForAdmin();
      setRows(data);
    } catch (e) {
      console.error(e);
      showToast('Marktplatz-Liste konnte nicht geladen werden.', 'error');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const openModal = (id: string, type: 'deactivate' | 'delete') => {
    setModal(type);
    setActionId(id);
    setReason('');
  };

  const closeModal = () => {
    setModal(null);
    setActionId(null);
    setReason('');
  };

  const submitModal = async () => {
    if (!actionId || !modal) return;
    const r = reason.trim();
    if (r.length < 5) {
      showToast('Bitte einen verständlichen Grund angeben (mindestens 5 Zeichen).', 'error');
      return;
    }
    try {
      if (modal === 'deactivate') {
        await AdminService.adminDeactivateMarketplaceListing(actionId, r);
        showToast('Anzeige deaktiviert. Der Nutzer sieht den Grund unter „Meine Anzeigen“.', 'success');
      } else {
        await AdminService.adminDeleteMarketplaceListing(actionId, r);
        showToast('Anzeige gelöscht. Der Nutzer wurde informiert.', 'success');
      }
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
      active: 'Aktiv',
      draft: 'Entwurf',
      sold: 'Verkauft',
      expired: 'Abgelaufen',
      inactive: 'Deaktiviert',
    };
    return map[s] || s;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-8 w-8 text-primary-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Marktplatz-Anzeigen</h1>
            <p className="text-sm text-gray-600">
              Anzeigen deaktivieren (unsichtbar, mit Begründung für den Nutzer) oder endgültig löschen.
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
        <p className="text-gray-500">Lade Anzeigen…</p>
      ) : rows.length === 0 ? (
        <p className="text-gray-500">Keine Anzeigen gefunden.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Titel</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Nutzer</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Typ</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Erstellt</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Aktionen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/80">
                  <td className="px-4 py-3 max-w-xs">
                    <div className="font-medium text-gray-900 truncate" title={row.title}>
                      {row.title}
                    </div>
                    {row.admin_deactivation_reason && (
                      <div className="mt-1 text-xs text-red-700 line-clamp-2">
                        Grund (Admin): {row.admin_deactivation_reason}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{row.users?.email || '—'}</div>
                    <div className="text-xs text-gray-500">
                      {[row.users?.first_name, row.users?.last_name].filter(Boolean).join(' ') || ''}
                    </div>
                  </td>
                  <td className="px-4 py-3">{statusLabel(row.status)}</td>
                  <td className="px-4 py-3 text-gray-600">{row.listing_type}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(row.created_at).toLocaleString('de-DE')}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="flex flex-wrap justify-end gap-2">
                      {row.status === 'active' && (
                        <button
                          type="button"
                          onClick={() => openModal(row.id, 'deactivate')}
                          className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-xs font-medium text-amber-900 hover:bg-amber-200"
                        >
                          <Ban className="h-3.5 w-3.5" />
                          Deaktivieren
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => openModal(row.id, 'delete')}
                        className="inline-flex items-center gap-1 rounded-md bg-red-100 px-2 py-1 text-xs font-medium text-red-900 hover:bg-red-200"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Löschen
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && actionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">
              {modal === 'deactivate' ? 'Anzeige deaktivieren' : 'Anzeige löschen'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {modal === 'deactivate'
                ? 'Die Anzeige wird im Marktplatz ausgeblendet. Der Nutzer sieht diesen Text unter „Meine Anzeigen“ und an der Anzeige.'
                : 'Die Anzeige wird unwiderruflich entfernt. Der Nutzer erhält einen Hinweis mit deiner Begründung.'}
            </p>
            <label htmlFor="mod-reason" className="mt-4 block text-sm font-medium text-gray-700">
              Begründung (mind. 5 Zeichen, sichtbar für den Nutzer)
            </label>
            <textarea
              id="mod-reason"
              rows={4}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="z. B. Verstoß gegen die Richtlinien (kein Tierverkauf) …"
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
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
                  modal === 'deactivate' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {modal === 'deactivate' ? 'Deaktivieren' : 'Endgültig löschen'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MarketplaceModeration;
