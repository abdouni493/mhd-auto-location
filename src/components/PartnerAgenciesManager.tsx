import React, { useEffect, useState } from 'react';
import { Link2, Plus, Trash2, Pencil, Loader2, PlugZap, CheckCircle2, AlertTriangle, X, Save } from 'lucide-react';
import { Language, PartnerAgency } from '../types';
import { PartnerService } from '../services/PartnerService';

interface Props { lang: Language }

type Draft = Omit<PartnerAgency, 'id' | 'createdAt'> & { id?: string };

const emptyDraft: Draft = { name: '', city: '', phone: '', email: '', supabaseUrl: '', anonKey: '', isActive: true };

/**
 * Paramètres → Agences partenaires.
 * Connecte d'autres applications de location (projets Supabase) : leurs
 * voitures s'affichent sur le site public et les réservations arrivent
 * directement dans l'application du propriétaire de la voiture.
 */
export const PartnerAgenciesManager: React.FC<Props> = ({ lang }) => {
  const T = (fr: string, ar: string) => (lang === 'fr' ? fr : ar);
  const [partners, setPartners] = useState<PartnerAgency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setPartners(await PartnerService.list());
      setError(null);
    } catch (e: any) {
      setError(e.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const runTest = async (d: Pick<Draft, 'supabaseUrl' | 'anonKey'>) => {
    setTesting(true);
    setTestResult(null);
    try {
      const r = await PartnerService.testConnection(d);
      setTestResult({ ok: true, msg: T(`Connexion réussie : ${r.cars} voiture(s), ${r.agencies} agence(s).`, `تم الاتصال: ${r.cars} سيارة، ${r.agencies} وكالة.`) });
      return true;
    } catch (e: any) {
      setTestResult({ ok: false, msg: T('Connexion impossible : ', 'تعذر الاتصال: ') + (e.message || String(e)) });
      return false;
    } finally {
      setTesting(false);
    }
  };

  const submit = async () => {
    if (!draft) return;
    if (!draft.name.trim() || !draft.supabaseUrl.trim() || !draft.anonKey.trim()) {
      setTestResult({ ok: false, msg: T('Nom, URL du projet et clé anon sont obligatoires.', 'الاسم ورابط المشروع والمفتاح إلزامية.') });
      return;
    }
    if (!/^https:\/\/.+/.test(draft.supabaseUrl.trim())) {
      setTestResult({ ok: false, msg: T("L'URL doit commencer par https://", 'يجب أن يبدأ الرابط بـ https://') });
      return;
    }
    if (!(await runTest(draft))) return;
    setSaving(true);
    try {
      await PartnerService.save(draft);
      setDraft(null);
      setTestResult(null);
      await load();
    } catch (e: any) {
      setTestResult({ ok: false, msg: e.message || String(e) });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (p: PartnerAgency) => {
    if (!window.confirm(T(`Déconnecter l'agence « ${p.name} » ?`, `فصل الوكالة « ${p.name} »؟`))) return;
    try { await PartnerService.remove(p.id); await load(); } catch (e: any) { setError(e.message || String(e)); }
  };

  const toggle = async (p: PartnerAgency) => {
    try { await PartnerService.save({ ...p, isActive: !p.isActive }); await load(); } catch (e: any) { setError(e.message || String(e)); }
  };

  const input = 'w-full rounded-xl border border-saas-border bg-white px-3.5 py-2.5 text-sm font-semibold text-saas-text-main focus:outline-none focus:ring-2 focus:ring-sky-200';
  const label = 'block text-[11px] font-black uppercase tracking-wider text-saas-text-muted mb-1.5';

  return (
    <div className="bg-white rounded-2xl border border-saas-border shadow-sm overflow-hidden">
      <div className="flex items-center gap-3.5 px-6 py-5 border-b border-saas-border">
        <span className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm" style={{ background: '#7C3AED' }}>
          <Link2 size={20} />
        </span>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-black text-saas-text-main tracking-tight">{T('Agences partenaires', 'الوكالات الشريكة')}</h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-saas-text-muted mt-0.5">
            {T('Applications de location connectées', 'تطبيقات تأجير متصلة')}
          </p>
        </div>
        {!draft && (
          <button onClick={() => { setDraft({ ...emptyDraft }); setTestResult(null); }}
            className="flex items-center gap-2 rounded-xl bg-[#7C3AED] text-white px-4 py-2.5 text-sm font-black hover:opacity-90 cursor-pointer">
            <Plus size={16} /> {T('Ajouter', 'إضافة')}
          </button>
        )}
      </div>

      <div className="p-6 space-y-5">
        <p className="text-sm text-saas-text-muted font-medium">
          {T(
            "Les voitures des agences connectées s'affichent sur votre site web. Quand un client réserve l'une d'elles, la réservation est créée directement dans l'application de l'agence propriétaire (menu « Commandes Website »).",
            'تظهر سيارات الوكالات المتصلة على موقعك. عند حجز إحداها يُسجَّل الحجز مباشرة في تطبيق الوكالة المالكة (قائمة « طلبات الموقع »).'
          )}
        </p>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
            <AlertTriangle size={18} className="shrink-0" /> {error}
          </div>
        )}

        {draft && (
          <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={label}>{T("Nom de l'agence *", 'اسم الوكالة *')}</label>
                <input className={input} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <label className={label}>{T('Ville', 'المدينة')}</label>
                <input className={input} value={draft.city || ''} onChange={e => setDraft({ ...draft, city: e.target.value })} />
              </div>
              <div>
                <label className={label}>{T('Téléphone', 'الهاتف')}</label>
                <input className={input} value={draft.phone || ''} onChange={e => setDraft({ ...draft, phone: e.target.value })} />
              </div>
              <div>
                <label className={label}>Email</label>
                <input className={input} type="email" value={draft.email || ''} onChange={e => setDraft({ ...draft, email: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>{T('URL du projet Supabase *', 'رابط مشروع Supabase *')}</label>
                <input className={input} placeholder="https://xxxxxxxx.supabase.co" value={draft.supabaseUrl}
                  onChange={e => setDraft({ ...draft, supabaseUrl: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className={label}>{T('Clé anon (publique) *', 'المفتاح العام anon *')}</label>
                <textarea className={`${input} font-mono text-xs`} rows={3} value={draft.anonKey}
                  onChange={e => setDraft({ ...draft, anonKey: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm font-bold text-saas-text-main cursor-pointer">
                <input type="checkbox" checked={draft.isActive} onChange={e => setDraft({ ...draft, isActive: e.target.checked })} />
                {T('Afficher ses voitures sur le site', 'إظهار سياراتها على الموقع')}
              </label>
            </div>

            {testResult && (
              <div className={`flex items-center gap-2 rounded-xl p-3 text-sm font-bold ${testResult.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                {testResult.ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />} {testResult.msg}
              </div>
            )}

            <div className="flex flex-wrap gap-2 justify-end">
              <button onClick={() => { setDraft(null); setTestResult(null); }}
                className="flex items-center gap-2 rounded-xl border border-saas-border bg-white px-4 py-2.5 text-sm font-black cursor-pointer">
                <X size={16} /> {T('Annuler', 'إلغاء')}
              </button>
              <button onClick={() => runTest(draft)} disabled={testing || !draft.supabaseUrl || !draft.anonKey}
                className="flex items-center gap-2 rounded-xl border border-violet-300 bg-white text-violet-700 px-4 py-2.5 text-sm font-black cursor-pointer disabled:opacity-50">
                {testing ? <Loader2 size={16} className="animate-spin" /> : <PlugZap size={16} />} {T('Tester', 'اختبار')}
              </button>
              <button onClick={submit} disabled={saving || testing}
                className="flex items-center gap-2 rounded-xl bg-[#7C3AED] text-white px-4 py-2.5 text-sm font-black cursor-pointer disabled:opacity-50">
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {T('Enregistrer', 'حفظ')}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="animate-spin text-violet-600" /></div>
        ) : partners.length === 0 ? (
          <p className="text-center py-8 text-sm font-bold text-saas-text-muted">{T('Aucune agence partenaire connectée.', 'لا توجد وكالات شريكة متصلة.')}</p>
        ) : (
          <div className="space-y-3">
            {partners.map(p => (
              <div key={p.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-saas-border p-4">
                <div className="flex-1 min-w-[200px]">
                  <p className="font-black text-saas-text-main">{p.name}{p.city ? <span className="text-saas-text-muted font-bold"> — {p.city}</span> : null}</p>
                  <p className="text-xs font-mono text-saas-text-muted truncate">{p.supabaseUrl}</p>
                  {p.phone && <p className="text-xs font-bold text-saas-text-muted">{p.phone}</p>}
                </div>
                <button onClick={() => toggle(p)}
                  className={`rounded-full px-3 py-1 text-xs font-black cursor-pointer ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {p.isActive ? T('Actif', 'نشط') : T('Désactivé', 'معطل')}
                </button>
                <button title={T('Modifier', 'تعديل')} onClick={() => { setDraft({ ...p }); setTestResult(null); }}
                  className="p-2 rounded-lg hover:bg-saas-bg cursor-pointer"><Pencil size={16} /></button>
                <button title={T('Supprimer', 'حذف')} onClick={() => remove(p)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-600 cursor-pointer"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
