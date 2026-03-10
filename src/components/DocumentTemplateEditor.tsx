import React, { useState, useEffect, useRef } from 'react';
import { DocumentType, DocumentTemplate, DocumentField } from '../types';
import { DocumentTemplateService } from '../services/DocumentTemplateService';
import { supabase } from '../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { Edit2, Plus, Trash2, RotateCcw, Save, X } from 'lucide-react';

interface DocumentTemplateEditorProps {
  documentType: DocumentType;
  onClose: () => void;
  onSave?: () => void;
}

interface DraggingField {
  fieldName: string;
  offsetX: number;
  offsetY: number;
}

const DEFAULT_FIELD_NAMES: Record<DocumentType, string[]> = {
  contrat: ['title', 'client_name', 'car_model', 'rental_dates', 'price_total', 'signature_line'],
  devis: ['title', 'quote_number', 'client_name', 'car_model', 'validity_date', 'price_total'],
  facture: ['title', 'invoice_number', 'invoice_date', 'client_name', 'car_model', 'amount_due', 'payment_terms'],
  recu: ['logo', 'agenceName', 'title', 'receipt_number', 'receipt_date', 'client_name', 'amount_paid', 'payment_method', 'totalLabel', 'totalAmount', 'paidLabel', 'paidAmount', 'remainingLabel', 'remainingAmount'],
  engagement: ['title', 'subtitle', 'engagement_number', 'commitment_date', 'client_label', 'client_name', 'vehicle_label', 'vehicle_info', 'terms_label', 'terms_conditions', 'signature_label', 'signature_line', 'date_label', 'date_line'],
};

export const DocumentTemplateEditor: React.FC<DocumentTemplateEditorProps> = ({
  documentType,
  onClose,
  onSave,
}) => {
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [agencySettings, setAgencySettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draggingField, setDraggingField] = useState<DraggingField | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedFontSize, setSelectedFontSize] = useState(12);
  const [newFieldName, setNewFieldName] = useState('');
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTemplate();
  }, [documentType]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      
      // Load all data in parallel
      const [templates, { data: agencyData, error: agencyError }] = await Promise.all([
        DocumentTemplateService.getDocumentTemplates(),
        supabase
          .from('agency_settings')
          .select('agency_name, logo, address, phone')
          .limit(1)
          .single()
      ]);
      
      if (agencyError) {
        console.error('DocumentTemplateEditor: Error fetching agency_settings:', agencyError);
      }
      
      const docTemplate = templates[documentType] || {};
      setTemplate(docTemplate);
      setAgencySettings(agencyData);
      
      console.log('DocumentTemplateEditor loaded data:', {
        template: !!docTemplate,
        agencySettings: agencyData,
        agencyName: agencyData?.agency_name,
        logoUrl: agencyData?.logo,
        documentType
      });
      
    } catch (error) {
      console.error('DocumentTemplateEditor: Error loading template data:', error);
      console.error('DocumentTemplateEditor: Detailed error:', {
        message: error?.message,
        stack: error?.stack,
        documentType
      });
      // Set defaults on error
      setTemplate({});
      setAgencySettings({
        agency_name: 'LuxDrive Premium Car Rental',
        logo: undefined
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFieldMouseDown = (fieldName: string, e: React.MouseEvent) => {
    e.preventDefault();
    const field = template?.[fieldName];
    if (!field) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggingField({
      fieldName,
      offsetX: e.clientX - rect.left - field.x,
      offsetY: e.clientY - rect.top - field.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingField || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(0, Math.min(e.clientX - rect.left - draggingField.offsetX, rect.width - 100));
    const newY = Math.max(0, Math.min(e.clientY - rect.top - draggingField.offsetY, rect.height - 30));

    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [draggingField.fieldName]: {
          ...prev[draggingField.fieldName],
          x: Math.round(newX),
          y: Math.round(newY),
        },
      };
    });
  };

  const handleMouseUp = () => {
    setDraggingField(null);
  };

  const handleUpdateField = (fieldName: string, updates: Partial<DocumentField>) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [fieldName]: {
          ...prev[fieldName],
          ...updates,
        },
      };
    });
  };

  const handleDeleteField = (fieldName: string) => {
    setTemplate((prev) => {
      if (!prev) return prev;
      const { [fieldName]: _, ...rest } = prev;
      return rest;
    });
    setEditingField(null);
  };

  const handleAddCustomField = () => {
    if (!newFieldName.trim()) return;

    const fieldName = `custom_${newFieldName.replace(/\s+/g, '_').toLowerCase()}`;
    
    setTemplate((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [fieldName]: {
          x: 80,
          y: 300,
          color: '#000000',
          fontSize: 12,
          customText: newFieldName,
        },
      };
    });
    setNewFieldName('');
  };

  const handleSave = async () => {
    if (!template) return;

    try {
      setSaving(true);
      await DocumentTemplateService.updateDocumentType(documentType, template);
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset this template to default?')) {
      DocumentTemplateService.resetDocumentType(documentType).then((templates) => {
        setTemplate(templates[documentType] || {});
      });
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">
            Customize {documentType.toUpperCase()} Template
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 grid grid-cols-3 gap-6">
          {/* Canvas - Document Preview */}
          <div className="col-span-2">
            <div
              ref={canvasRef}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className="relative bg-gray-50 border-2 border-gray-300 rounded-lg p-8"
              style={{
                width: '100%',
                minHeight: '600px',
                cursor: draggingField ? 'grabbing' : 'default',
              }}
            >
              {/* Document Background */}
              <div
                className="absolute inset-8 bg-white shadow-lg rounded"
                style={{ pointerEvents: 'none' }}
              />

              {/* Agency Header - From agency_settings table except for engagement */}
              {agencySettings && documentType !== 'engagement' && (
                <div className="absolute top-12 left-12 right-12 z-10" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <div className="flex justify-between items-start mb-6 pb-4 border-b-2 border-gray-300">
                    <div className="flex-1">
                      <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {agencySettings.agency_name || 'LuxDrive Premium Car Rental'}
                      </h1>
                    </div>
                    {agencySettings.logo && (
                      <div className="ml-4">
                        <img
                          src={agencySettings.logo}
                          alt="Agency Logo"
                          style={{ height: 70 }}
                          className="object-contain"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            console.error('DocumentTemplateEditor: Logo failed to load from agency_settings:', agencySettings.logo);
                            console.error('DocumentTemplateEditor: Logo load error details:', e);
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('DocumentTemplateEditor: Logo loaded successfully from agency_settings:', agencySettings.logo);
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Render Fields */}
              {template &&
                Object.entries(template).map(([fieldName, fieldValue]) => {
                  const field = fieldValue as any;
                  return (
                    <motion.div
                      key={fieldName}
                      className={`absolute p-2 border-2 rounded transition-all ${
                        editingField === fieldName
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-300 hover:border-blue-400 bg-white'
                      } cursor-grab active:cursor-grabbing`}
                      style={{
                        left: `${field.x}px`,
                        top: `${field.y}px`,
                        color: field.color || '#000000',
                        fontSize: `${field.fontSize || 12}px`,
                        fontWeight: field.fontWeight || 'normal',
                        textAlign: field.textAlign || 'left',
                        maxWidth: `${field.maxWidth || 200}px`,
                        zIndex: editingField === fieldName ? 50 : 40,
                      }}
                      onMouseDown={(e) => handleFieldMouseDown(fieldName, e)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingField(fieldName);
                        setSelectedColor(field.color || '#000000');
                        setSelectedFontSize(field.fontSize || 12);
                      }}
                    >
                      <span className="text-xs font-semibold text-gray-600 block mb-1">
                        {fieldName}
                      </span>
                      <div className="text-sm">{field.customText || `[${fieldName}]`}</div>
                    </motion.div>
                  );
                })}
            </div>
          </div>

          {/* Sidebar - Field Editor */}
          <div className="col-span-1">
            <div className="space-y-6">
              {/* Add Custom Field */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <Plus size={16} /> Add Custom Text
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newFieldName}
                    onChange={(e) => setNewFieldName(e.target.value)}
                    placeholder="Field name..."
                    className="w-full px-3 py-2 border border-blue-300 rounded text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleAddCustomField();
                    }}
                  />
                  <button
                    onClick={handleAddCustomField}
                    className="w-full bg-blue-600 text-white py-2 rounded text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    Add Field
                  </button>
                </div>
              </div>

              {/* Field Editor */}
              {editingField && template?.[editingField] && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Edit2 size={16} /> {editingField}
                  </h3>

                  <div className="space-y-3">
                    {/* Position */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Position X: {template[editingField].x}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="800"
                        value={template[editingField].x}
                        onChange={(e) =>
                          handleUpdateField(editingField, { x: parseInt(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Position Y: {template[editingField].y}px
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="700"
                        value={template[editingField].y}
                        onChange={(e) =>
                          handleUpdateField(editingField, { y: parseInt(e.target.value) })
                        }
                        className="w-full"
                      />
                    </div>

                    {/* Color */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Color
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={selectedColor}
                          onChange={(e) => {
                            setSelectedColor(e.target.value);
                            handleUpdateField(editingField, { color: e.target.value });
                          }}
                          className="w-12 h-10 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={selectedColor}
                          onChange={(e) => {
                            setSelectedColor(e.target.value);
                            handleUpdateField(editingField, { color: e.target.value });
                          }}
                          className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    </div>

                    {/* Font Size */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Font Size: {selectedFontSize}px
                      </label>
                      <input
                        type="range"
                        min="8"
                        max="36"
                        value={selectedFontSize}
                        onChange={(e) => {
                          const size = parseInt(e.target.value);
                          setSelectedFontSize(size);
                          handleUpdateField(editingField, { fontSize: size });
                        }}
                        className="w-full"
                      />
                    </div>

                    {/* Custom Text */}
                    {template[editingField].customText && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Custom Text
                        </label>
                        <input
                          type="text"
                          value={template[editingField].customText || ''}
                          onChange={(e) =>
                            handleUpdateField(editingField, { customText: e.target.value })
                          }
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                        />
                      </div>
                    )}

                    {/* Delete Button */}
                    {editingField.startsWith('custom_') && (
                      <button
                        onClick={() => handleDeleteField(editingField)}
                        className="w-full bg-red-600 text-white py-2 rounded text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 size={14} /> Delete Field
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Default Fields List */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Fields</h3>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {template &&
                    Object.keys(template).map((fieldName) => (
                      <button
                        key={fieldName}
                        onClick={() => setEditingField(fieldName)}
                        className={`w-full text-left px-2 py-2 rounded text-sm transition-colors ${
                          editingField === fieldName
                            ? 'bg-blue-500 text-white'
                            : 'hover:bg-gray-200 text-gray-900'
                        }`}
                      >
                        {fieldName}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-between gap-4">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium flex items-center gap-2 transition-colors"
          >
            <RotateCcw size={16} /> Reset to Default
          </button>

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium disabled:bg-gray-400 transition-colors flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
