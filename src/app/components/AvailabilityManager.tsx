import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar, Clock, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Availability {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface AvailabilityManagerProps {
  open: boolean;
  onClose: () => void;
  sellerId: string;
}

export function AvailabilityManager({ open, onClose, sellerId }: AvailabilityManagerProps) {
  const [slots, setSlots] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ day: 1, start: '09:00', end: '17:00' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open) fetchAvailability();
  }, [open]);

  const fetchAvailability = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('seller_availability')
      .select('*')
      .eq('seller_id', sellerId)
      .order('day_of_week', { ascending: true });

    if (error) toast.error('Error al cargar disponibilidad');
    else setSlots(data || []);
    setLoading(false);
  };

  const handleAdd = async () => {
    if (newSlot.start >= newSlot.end) {
      toast.error('La hora de inicio debe ser antes de la hora de fin');
      return;
    }
    setAdding(true);
    const { data, error } = await supabase
      .from('seller_availability')
      .insert({
        seller_id: sellerId,
        day_of_week: newSlot.day,
        start_time: newSlot.start,
        end_time: newSlot.end,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') toast.error('Ya existe un horario igual para ese día');
      else toast.error('Error al agregar horario');
      setAdding(false);
      return;
    }
    setSlots(prev => [...prev, data].sort((a, b) => a.day_of_week - b.day_of_week));
    toast.success('Horario agregado');
    setAdding(false);
  };

  const handleRemove = async (id: string) => {
    const { error } = await supabase.from('seller_availability').delete().eq('id', id);
    if (error) { toast.error('Error al eliminar'); return; }
    setSlots(prev => prev.filter(s => s.id !== id));
  };

  const handleToggle = async (slot: Availability) => {
    const { error } = await supabase
      .from('seller_availability')
      .update({ is_active: !slot.is_active })
      .eq('id', slot.id);
    if (error) { toast.error('Error al actualizar'); return; }
    setSlots(prev => prev.map(s => s.id === slot.id ? { ...s, is_active: !s.is_active } : s));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Mi Disponibilidad
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm text-gray-500 -mt-2">
          Define los días y horarios en que atiendes citas. Los clientes solo podrán reservar dentro de estos horarios.
        </p>

        {/* Agregar nuevo horario */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-medium text-gray-700">Agregar horario</p>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={newSlot.day}
              onChange={e => setNewSlot(p => ({ ...p, day: parseInt(e.target.value) }))}
              className="px-2 py-2 border rounded-lg text-sm"
            >
              {DAYS.map((day, i) => <option key={i} value={i}>{day}</option>)}
            </select>
            <input
              type="time"
              value={newSlot.start}
              onChange={e => setNewSlot(p => ({ ...p, start: e.target.value }))}
              className="px-2 py-2 border rounded-lg text-sm"
            />
            <input
              type="time"
              value={newSlot.end}
              onChange={e => setNewSlot(p => ({ ...p, end: e.target.value }))}
              className="px-2 py-2 border rounded-lg text-sm"
            />
          </div>
          <Button onClick={handleAdd} disabled={adding} size="sm" className="w-full">
            {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Agregar Horario
          </Button>
        </div>

        {/* Lista de horarios */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aún no has definido horarios</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map(slot => (
              <div key={slot.id} className="flex items-center justify-between bg-white border rounded-xl p-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(slot)}
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${slot.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                    title={slot.is_active ? 'Activo' : 'Inactivo'}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{DAYS[slot.day_of_week]}</p>
                    <p className="text-xs text-gray-500">{slot.start_time.slice(0,5)} - {slot.end_time.slice(0,5)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemove(slot.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
