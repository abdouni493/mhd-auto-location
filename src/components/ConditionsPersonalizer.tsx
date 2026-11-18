import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Printer, FileText, Plus, Pencil, Trash2, Check, ChevronUp, ChevronDown,
  Eye, ListChecks, RotateCcw, Loader2, Settings2, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { generateConditionsPrintHTML, ConditionItem, ConditionsTemplate } from '../constants/ConditionsTemplates';
import { ConditionsStore, ConditionsSet, ConditionsLang, defaultConditionsSet } from '../services/ConditionsStore';

interface ConditionsPersonalizerProps {
  lang: 'fr' | 'ar';
  reservationId?: string;
  onClose: () => void;
  onSave?: (conditions: string) => void;
  agencyId?: string;
}

type Tab = 'edit' | 'preview';
type Toast = { kind: 'ok' | 'warn' | 'err'; text: string } | null;

/**
 * Conditions de location : consultation, personnalisation et impression.
 * - ajouter une nouvelle condition
 * - modifier / supprimer / réordonner les conditions existantes
 * - modifier le titre, sous-titre, texte d'acceptation et signatures
 * Tout est enregistré dans le modèle d'impression de l'agence et rechargé à
 * chaque ouverture.
 */
export const ConditionsPersonalizer: React.FC<ConditionsPersonalizerProps> = ({ lang, onClose }) => {
  const ui = (fr: string, ar: string) => (lang === 'ar' ? ar : fr);

  const [docLang, setDocLang] = useState<ConditionsLang>('ar');
  const [set, setSet] = useState<ConditionsSet>(() => defaultConditionsSet());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>('edit');
  const [toast, setToast] = useState<Toast>(null);

  // Édition d'une condition existante
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState<ConditionItem>({ title: '', content: '' });
  // Suppression (confirmation en 2 clics)
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  // Ajout
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<ConditionItem>({ title: '', content: '' });
  // Paramètres du document
  const [showSettings, setShowSettings] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<Partial<ConditionsTemplate>>({});
  const [confirmReset, setConfirmReset] = useState(false);

  const template = set[docLang];
  const isArabicDoc = docLang === 'ar';
  const docDir = isArabicDoc ? 'rtl' : 'ltr';

  useEffect(() => {
    let alive = true;
    ConditionsStore.load()
      .then(s => { if (alive) setSet(s); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  // Réinitialise les éditions en cours quand on change de langue du document
  useEffect(() => {
    setEditIndex(null);
    setConfirmDelete(null);
    setAdding(false);
    setShowSettings(false);
    setConfirmReset(false);
  }, [docLang]);

  const previewHtml = useMemo(() => generateConditionsPrintHTML(docLang, template), [docLang, template]);

  /** Applique une modification au modèle de la langue courante puis enregistre. */
  const persist = async (next: ConditionsSet | null, okText: string) => {
    // Mise à jour immédiate de l'écran, enregistrement en arrière-plan.
    setSet(next || defaultConditionsSet());
    setSaving(true);
    try {
      const target = await ConditionsStore.save(next);
      setToast(
        target === 'database'
          ? { kind: 'ok', text: okText }
          : { kind: 'warn', text: ui('Enregistré sur cet appareil uniquement', 'تم الحفظ على هذا الجهاز فقط') },
      );
    } catch {
      setToast({ kind: 'err', text: ui("Échec de l'enregistrement", 'فشل الحفظ') });
    } finally {
      setSaving(false);
    }
  };

  const updateTemplate = (patch: Partial<ConditionsTemplate>, okText: string) =>
    persist({ ...set, [docLang]: { ...template, ...patch } }, okText);

  const savedText = ui('Modèle enregistré', 'تم حفظ النموذج');

  // ── Actions sur les conditions ────────────────────────────────────────────
  const startEdit = (i: number) => {
    setAdding(false);
    setConfirmDelete(null);
    setEditIndex(i);
    setDraft({ ...template.conditions[i] });
  };

  const saveEdit = async () => {
    if (editIndex === null) return;
    if (!draft.title.trim() && !draft.content.trim()) return;
    const conditions = template.conditions.map((c, i) =>
      i === editIndex ? { title: draft.title.trim(), content: draft.content.trim() } : c,
    );
    setEditIndex(null);
    await updateTemplate({ conditions }, ui('Condition modifiée', 'تم تعديل الشرط'));
  };

  const deleteAt = async (i: number) => {
    const conditions = template.conditions.filter((_, idx) => idx !== i);
    setConfirmDelete(null);
    if (editIndex === i) setEditIndex(null);
    await updateTemplate({ conditions }, ui('Condition supprimée', 'تم حذف الشرط'));
  };

  const move = async (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= template.conditions.length) return;
    const conditions = [...template.conditions];
    [conditions[i], conditions[j]] = [conditions[j], conditions[i]];
    setEditIndex(null);
    setConfirmDelete(null);
    await updateTemplate({ conditions }, ui('Ordre mis à jour', 'تم تحديث الترتيب'));
  };

  const addCondition = async () => {
    if (!newItem.title.trim() && !newItem.content.trim()) return;
    const conditions = [...template.conditions, { title: newItem.title.trim(), content: newItem.content.trim() }];
    setNewItem({ title: '', content: '' });
    setAdding(false);
    await updateTemplate({ conditions }, ui('Condition ajoutée', 'تمت إضافة الشرط'));
  };

  const openSettings = () => {
    setSettingsDraft({
      title: template.title,
      subtitle: template.subtitle,
      acceptanceText: template.acceptanceText ?? '',
      agencySignatureLabel: template.agencySignatureLabel,
      clientSignatureLabel: template.clientSignatureLabel,
    });
    setShowSettings(true);
  };

  const saveSettings = async () => {
    setShowSettings(false);
    await updateTemplate(settingsDraft, savedText);
  };

  const resetLanguage = async () => {
    setConfirmReset(false);
    await persist({ ...set, [docLang]: defaultConditionsSet()[docLang] }, ui('Modèle par défaut restauré', 'تمت استعادة النموذج الافتراضي'));
  };

  const handlePrint = () => {
    const w = window.open('', '', 'height=900,width=820');
    if (!w) {
      setToast({ kind: 'err', text: ui('Autorisez les fenêtres pop-up pour imprimer', 'اسمح بالنوافذ المنبثقة للطباعة') });
      return;
    }
    w.document.write(previewHtml);
    w.document.close();
    w.focus();
    setTimeout(() => { w.print(); }, 350);
  };

  // ── Styles réutilisables ────────────────────────────────────────────────
  const input =
    'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 shadow-sm outline-none transition focus:border-indigo-400 focus:ring-4 focus:ring-indigo-100';
  const btn = 'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <>
      <motion.div
        key="cond-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        key="cond-modal"
        initial={{ opacity: 0, scale: 0.97, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 sm:p-6"
        onClick={onClose}
      >
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          onClick={e => e.stopPropagation()}
          className="flex w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-[0_30px_90px_-20px_rgba(30,27,75,0.55)] ring-1 ring-white/10"
          style={{ maxHeight: 'calc(100vh - 24px)' }}
        >
          {/* ── En-tête ── */}
          <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-800 to-violet-700 px-5 py-5 sm:px-7">
            <div className="pointer-events-none absolute -top-16 end-10 h-44 w-44 rounded-full bg-fuchsia-400/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 start-0 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl" />

            <div className="relative flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                  <FileText size={24} className="text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-extrabold text-white sm:text-xl">
                    {ui('Conditions de location', 'شروط الإيجار')}
                  </h2>
                  <p className="truncate text-xs text-indigo-100/80 sm:text-sm">
                    {ui('Ajoutez, modifiez ou supprimez vos conditions puis imprimez', 'أضف شروطك أو عدّلها أو احذفها ثم اطبعها')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-xl bg-white/10 p-1 ring-1 ring-white/20">
                  {(['ar', 'fr'] as const).map(l => (
                    <button
                      key={l}
                      onClick={() => setDocLang(l)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold transition sm:text-sm ${
                        docLang === l ? 'bg-white text-indigo-900 shadow' : 'text-white/85 hover:bg-white/10'
                      }`}
                    >
                      {l === 'ar' ? 'العربية' : 'Français'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={onClose}
                  aria-label={ui('Fermer', 'إغلاق')}
                  className="rounded-xl bg-white/10 p-2 text-white ring-1 ring-white/20 transition hover:bg-white/20"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Onglets */}
            <div className="relative mt-5 flex gap-2">
              {([
                { id: 'edit', icon: ListChecks, label: ui('Gérer les conditions', 'إدارة الشروط') },
                { id: 'preview', icon: Eye, label: ui("Aperçu d'impression", 'معاينة الطباعة') },
              ] as const).map(t => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                    tab === t.id
                      ? 'bg-white text-indigo-900 shadow-lg shadow-indigo-950/30'
                      : 'bg-white/10 text-white/90 hover:bg-white/20'
                  }`}
                >
                  <t.icon size={16} />
                  {t.label}
                  {t.id === 'edit' && (
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${tab === t.id ? 'bg-indigo-100 text-indigo-700' : 'bg-white/20 text-white'}`}>
                      {template.conditions.length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* ── Corps ── */}
          <div className="min-h-0 flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-24 text-slate-500">
                <Loader2 className="animate-spin" size={22} />
                {ui('Chargement du modèle…', 'جارٍ تحميل النموذج…')}
              </div>
            ) : tab === 'preview' ? (
              <div className="bg-slate-200/70 p-3 sm:p-6">
                <div className="mx-auto overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-slate-300" style={{ maxWidth: 798 }}>
                  <iframe
                    title="conditions-preview"
                    srcDoc={previewHtml}
                    className="block w-full border-0"
                    style={{ height: '78vh' }}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 p-4 sm:p-6">
                {/* Document : titre / paramètres */}
                <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-4 shadow-sm sm:p-5">
                  {!showSettings ? (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0" dir={docDir}>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500">
                          {ui('Document imprimé', 'المستند المطبوع')}
                        </p>
                        <h3 className="truncate text-lg font-extrabold text-indigo-950">{template.title}</h3>
                        <p className="truncate text-sm italic text-slate-500">{template.subtitle}</p>
                      </div>
                      <button onClick={openSettings} className={`${btn} bg-white text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50`}>
                        <Settings2 size={16} />
                        {ui('Titre & signatures', 'العنوان والتوقيعات')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3" dir={docDir}>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-slate-600">{ui('Titre', 'العنوان')}</span>
                          <input className={input} value={settingsDraft.title ?? ''} onChange={e => setSettingsDraft(d => ({ ...d, title: e.target.value }))} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-slate-600">{ui('Sous-titre', 'العنوان الفرعي')}</span>
                          <input className={input} value={settingsDraft.subtitle ?? ''} onChange={e => setSettingsDraft(d => ({ ...d, subtitle: e.target.value }))} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-slate-600">{ui('Signature agence', 'توقيع الوكالة')}</span>
                          <input className={input} value={settingsDraft.agencySignatureLabel ?? ''} onChange={e => setSettingsDraft(d => ({ ...d, agencySignatureLabel: e.target.value }))} />
                        </label>
                        <label className="block">
                          <span className="mb-1 block text-xs font-semibold text-slate-600">{ui('Signature client', 'توقيع الزبون')}</span>
                          <input className={input} value={settingsDraft.clientSignatureLabel ?? ''} onChange={e => setSettingsDraft(d => ({ ...d, clientSignatureLabel: e.target.value }))} />
                        </label>
                      </div>
                      <label className="block">
                        <span className="mb-1 block text-xs font-semibold text-slate-600">
                          {ui("Texte d'acceptation (laisser vide pour le masquer)", 'نص الموافقة (اتركه فارغًا لإخفائه)')}
                        </span>
                        <textarea rows={2} className={input} value={settingsDraft.acceptanceText ?? ''} onChange={e => setSettingsDraft(d => ({ ...d, acceptanceText: e.target.value }))} />
                      </label>
                      <div className="flex flex-wrap justify-end gap-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                        <button onClick={() => setShowSettings(false)} className={`${btn} bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50`}>
                          {ui('Annuler', 'إلغاء')}
                        </button>
                        <button onClick={saveSettings} disabled={saving} className={`${btn} bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700`}>
                          <Check size={16} />
                          {ui('Enregistrer', 'حفظ')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Liste des conditions */}
                <div className="space-y-2.5">
                  {template.conditions.length === 0 && (
                    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white py-10 text-center text-sm text-slate-500">
                      {ui('Aucune condition. Ajoutez-en une ci-dessous.', 'لا توجد شروط. أضف شرطًا أدناه.')}
                    </div>
                  )}

                  <AnimatePresence initial={false}>
                    {template.conditions.map((c, i) => {
                      const isEditing = editIndex === i;
                      const isConfirming = confirmDelete === i;
                      return (
                        <motion.div
                          key={`${docLang}-${i}-${c.title}`}
                          layout
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, height: 0 }}
                          className={`group rounded-2xl border bg-white shadow-sm transition ${
                            isEditing ? 'border-amber-300 ring-4 ring-amber-100' : isConfirming ? 'border-rose-300 ring-4 ring-rose-100' : 'border-slate-200 hover:border-indigo-200 hover:shadow-md'
                          }`}
                        >
                          {isEditing ? (
                            <div className="space-y-3 p-4" dir={docDir}>
                              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-600">
                                <Pencil size={14} /> {ui('Modifier la condition', 'تعديل الشرط')} #{i + 1}
                              </div>
                              <input
                                autoFocus
                                className={input}
                                placeholder={ui('Titre (ex. Carburant)', 'العنوان (مثال: الوقود)')}
                                value={draft.title}
                                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
                              />
                              <textarea
                                rows={3}
                                className={input}
                                placeholder={ui('Texte de la condition', 'نص الشرط')}
                                value={draft.content}
                                onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
                              />
                              <div className="flex flex-wrap justify-end gap-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                                <button onClick={() => setEditIndex(null)} className={`${btn} bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50`}>
                                  {ui('Annuler', 'إلغاء')}
                                </button>
                                <button
                                  onClick={saveEdit}
                                  disabled={saving || (!draft.title.trim() && !draft.content.trim())}
                                  className={`${btn} bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700`}
                                >
                                  <Check size={16} /> {ui('Enregistrer', 'حفظ')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3 p-3.5 sm:p-4">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-sm font-extrabold text-white shadow-md shadow-indigo-500/30">
                                {i + 1}
                              </div>
                              <div className="min-w-0 flex-1" dir={docDir} style={{ textAlign: isArabicDoc ? 'right' : 'left' }}>
                                <p className="font-bold text-indigo-950">{c.title || <span className="italic text-slate-400">{ui('(sans titre)', '(بدون عنوان)')}</span>}</p>
                                <p className="mt-0.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">{c.content}</p>
                              </div>

                              {isConfirming ? (
                                <div className="flex shrink-0 flex-col items-stretch gap-1.5 sm:flex-row sm:items-center">
                                  <button onClick={() => deleteAt(i)} disabled={saving} className={`${btn} bg-rose-600 px-3 py-2 text-white hover:bg-rose-700`}>
                                    <Trash2 size={15} /> {ui('Supprimer', 'حذف')}
                                  </button>
                                  <button onClick={() => setConfirmDelete(null)} className={`${btn} bg-slate-100 px-3 py-2 text-slate-600 hover:bg-slate-200`}>
                                    {ui('Annuler', 'إلغاء')}
                                  </button>
                                </div>
                              ) : (
                                <div className="flex shrink-0 items-center gap-1">
                                  <div className="hidden flex-col sm:flex">
                                    <button
                                      onClick={() => move(i, -1)}
                                      disabled={i === 0 || saving}
                                      title={ui('Monter', 'إلى الأعلى')}
                                      className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-30"
                                    >
                                      <ChevronUp size={16} />
                                    </button>
                                    <button
                                      onClick={() => move(i, 1)}
                                      disabled={i === template.conditions.length - 1 || saving}
                                      title={ui('Descendre', 'إلى الأسفل')}
                                      className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-indigo-600 disabled:opacity-30"
                                    >
                                      <ChevronDown size={16} />
                                    </button>
                                  </div>
                                  <button
                                    onClick={() => startEdit(i)}
                                    title={ui('Modifier', 'تعديل')}
                                    className="rounded-xl bg-amber-50 p-2.5 text-amber-600 ring-1 ring-amber-200 transition hover:bg-amber-100"
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    onClick={() => { setEditIndex(null); setConfirmDelete(i); }}
                                    title={ui('Supprimer', 'حذف')}
                                    className="rounded-xl bg-rose-50 p-2.5 text-rose-600 ring-1 ring-rose-200 transition hover:bg-rose-100"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Ajout */}
                {adding ? (
                  <div className="space-y-3 rounded-2xl border border-emerald-300 bg-emerald-50/60 p-4 ring-4 ring-emerald-100" dir={docDir}>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700">
                      <Plus size={14} /> {ui('Nouvelle condition', 'شرط جديد')} #{template.conditions.length + 1}
                    </div>
                    <input
                      autoFocus
                      className={input}
                      placeholder={ui('Titre (ex. Kilométrage)', 'العنوان (مثال: عدد الكيلومترات)')}
                      value={newItem.title}
                      onChange={e => setNewItem(d => ({ ...d, title: e.target.value }))}
                    />
                    <textarea
                      rows={3}
                      className={input}
                      placeholder={ui('Texte de la condition', 'نص الشرط')}
                      value={newItem.content}
                      onChange={e => setNewItem(d => ({ ...d, content: e.target.value }))}
                    />
                    <div className="flex flex-wrap justify-end gap-2" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                      <button onClick={() => { setAdding(false); setNewItem({ title: '', content: '' }); }} className={`${btn} bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50`}>
                        {ui('Annuler', 'إلغاء')}
                      </button>
                      <button
                        onClick={addCondition}
                        disabled={saving || (!newItem.title.trim() && !newItem.content.trim())}
                        className={`${btn} bg-emerald-600 text-white shadow-md shadow-emerald-600/25 hover:bg-emerald-700`}
                      >
                        <Check size={16} /> {ui('Ajouter au modèle', 'إضافة إلى النموذج')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditIndex(null); setConfirmDelete(null); setAdding(true); }}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-emerald-300 bg-white py-4 text-sm font-bold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50"
                  >
                    <Plus size={18} />
                    {ui('Ajouter une nouvelle condition', 'إضافة شرط جديد')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* ── Pied ── */}
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white px-4 py-3.5 sm:px-6">
            <div className="flex items-center gap-2">
              {confirmReset ? (
                <>
                  <span className="text-xs font-semibold text-rose-600">{ui('Restaurer le modèle par défaut ?', 'استعادة النموذج الافتراضي؟')}</span>
                  <button onClick={resetLanguage} className={`${btn} bg-rose-600 px-3 py-2 text-white hover:bg-rose-700`}>{ui('Oui', 'نعم')}</button>
                  <button onClick={() => setConfirmReset(false)} className={`${btn} bg-slate-100 px-3 py-2 text-slate-600 hover:bg-slate-200`}>{ui('Non', 'لا')}</button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  disabled={loading || saving}
                  className={`${btn} bg-slate-100 px-3 py-2 text-slate-600 hover:bg-slate-200`}
                  title={ui('Restaurer les conditions par défaut', 'استعادة الشروط الافتراضية')}
                >
                  <RotateCcw size={15} />
                  <span className="hidden sm:inline">{ui('Par défaut', 'الافتراضي')}</span>
                </button>
              )}
              {saving && <Loader2 size={16} className="animate-spin text-indigo-500" />}
            </div>

            <div className="flex items-center gap-2">
              <button onClick={onClose} className={`${btn} bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50`}>
                {ui('Fermer', 'إغلاق')}
              </button>
              <button
                onClick={handlePrint}
                disabled={loading || template.conditions.length === 0}
                className={`${btn} bg-gradient-to-r from-indigo-600 to-violet-600 px-5 text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-700 hover:to-violet-700`}
              >
                <Printer size={17} />
                {ui('Imprimer', 'طباعة')} ({docLang === 'ar' ? 'AR' : 'FR'})
              </button>
            </div>
          </div>

          {/* Notification */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className={`pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-2xl px-4 py-2.5 text-sm font-semibold text-white shadow-xl ${
                  toast.kind === 'ok' ? 'bg-emerald-600' : toast.kind === 'warn' ? 'bg-amber-500' : 'bg-rose-600'
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  {toast.kind === 'ok' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {toast.text}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};
