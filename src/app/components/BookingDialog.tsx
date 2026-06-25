import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Calendar, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface BookingDialogProps {
  open: boolean;
  onClose: () => void;
  service: {
    id: string;
    name: string;
    price: number;
    seller_id: string;
    seller_name: string;
    duration_minutes: number;
  };
}

interface AvailSlot { day_of_week: number; start_time: string; end_time: string; }

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function BookingDialog({ open, onClose, service }: BookingDialogProps) {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<AvailSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm' | 'done'>('select');
  const [notes, setNotes] = useState('');

  // Próximos 14 días
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d;
  });

  useEffect(() => {
    if (open) fetchAvailability();
  }, [open]);

  useEffect(() => {
    if (selectedDate) fetchBookedSlots(selectedDate);
  }, [selectedDate]);

  const fetchAvailability = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('seller_availability')
      .select('day_of_week, start_time, end_time')
      .eq('seller_id', service.seller_id)
      .eq('is_active', true);
    setAvailability(data || []);
    setLoading(false);
  };

  const fetchBookedSlots = async (date: string) => {
    const { data } = await supabase
      .from('bookings')
      .select('start_time')
      .eq('seller_id', service.seller_id)
      .eq('booking_date', date)
      .neq('status', 'cancelled');
    setBookedSlots((data || []).map(b => b.start_time.slice(0, 5)));
  };

  // Genera horarios disponibles para la fecha seleccionada según la duración del servicio
  const getTimeSlots = (date: Date) => {
    const dayOfWeek = date.getDay();
    const dayAvail = availability.filter(a => a.day_of_week === dayOfWeek);
    if (dayAvail.length === 0) return [];

    const slots: string[] = [];
    dayAvail.forEach(avail => {
      let current = parseInt(avail.start_time.slice(0, 2)) * 60 + parseInt(avail.start_time.slice(3, 5));
      const end = parseInt(avail.end_time.slice(0, 2)) * 60 + parseInt(avail.end_time.slice(3, 5));
      while (current + service.duration_minutes <= end) {
        const h = Math.floor(current / 60).toString().padStart(2, '0');
        const m = (current % 60).toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
        current += service.duration_minutes;
      }
    });
    return slots;
  };

  const handleSelectDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    setSelectedTime('');
  };

  const handleConfirm = async () => {
    if (!user || !selectedDate || !selectedTime) return;
    setSubmitting(true);

    const [h, m] = selectedTime.split(':').map(Number);
    const endMinutes = h * 60 + m + service.duration_minutes;
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`;

    const { error } = await supabase.from('bookings').insert({
      product_id: service.id,
      buyer_id: user.id,
      seller_id: service.seller_id,
      booking_date: selectedDate,
      start_time: selectedTime,
      end_time: endTime,
      status: 'pending',
      notes: notes.trim() || null,
    });

    if (error) {
      if (error.code === '23505') toast.error('Ese horario ya fue reservado, elige otro');
      else toast.error('Error al crear la reserva');
      setSubmitting(false);
      return;
    }

    setStep('done');
    toast.success('¡Cita reservada exitosamente!');
    setSubmitting(false);
  };

  const handleClose = () => {
    setStep('select');
    setSelectedDate('');
    setSelectedTime('');
    setNotes('');
    onClose();
  };

  const availableTimeSlots = selectedDate
    ? getTimeSlots(new Date(selectedDate + 'T00:00:00')).filter(t => !bookedSlots.includes(t))
    : [];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            {step === 'done' ? 'Cita Confirmada' : `Reservar: ${service.name}`}
          </DialogTitle>
        </DialogHeader>

        {step === 'done' ? (
          <div className="text-center py-6">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">¡Tu cita está reservada!</h3>
            <p className="text-gray-600 text-sm mb-4">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long' })} a las {selectedTime}
            </p>
            <p className="text-xs text-gray-400 mb-4">
              El vendedor confirmará tu cita pronto. Recibirás una notificación.
            </p>
            <Button onClick={handleClose} className="w-full">Listo</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-3 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Con {service.seller_name}</p>
                <p className="text-xs text-gray-400">{service.duration_minutes} min</p>
              </div>
              <p className="font-bold text-blue-600">${service.price}</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : availability.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">
                Este vendedor aún no ha configurado su disponibilidad
              </p>
            ) : (
              <>
                {/* Fechas */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Elige una fecha</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {dates.map(date => {
                      const dateStr = date.toISOString().split('T')[0];
                      const hasSlots = getTimeSlots(date).length > 0;
                      return (
                        <button
                          key={dateStr}
                          disabled={!hasSlots}
                          onClick={() => handleSelectDate(date)}
                          className={`flex flex-col items-center justify-center min-w-[52px] h-16 rounded-xl border-2 flex-shrink-0 transition-all ${
                            selectedDate === dateStr
                              ? 'border-blue-500 bg-blue-50'
                              : hasSlots
                              ? 'border-gray-200 hover:border-blue-300'
                              : 'border-gray-100 opacity-30 cursor-not-allowed'
                          }`}
                        >
                          <span className="text-xs text-gray-500">{DAYS_SHORT[date.getDay()]}</span>
                          <span className={`text-sm font-bold ${selectedDate === dateStr ? 'text-blue-600' : 'text-gray-700'}`}>
                            {date.getDate()}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Horarios */}
                {selectedDate && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Elige un horario</p>
                    {availableTimeSlots.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">No hay horarios disponibles este día</p>
                    ) : (
                      <div className="grid grid-cols-4 gap-2">
                        {availableTimeSlots.map(time => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={`py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                              selectedTime === time
                                ? 'border-blue-500 bg-blue-50 text-blue-600'
                                : 'border-gray-200 text-gray-600 hover:border-blue-300'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Notas */}
                {selectedTime && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Notas (opcional)</p>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="Algo que el vendedor deba saber..."
                      className="w-full px-3 py-2 border rounded-lg text-sm resize-none"
                      rows={2}
                    />
                  </div>
                )}

                <Button
                  onClick={handleConfirm}
                  disabled={!selectedDate || !selectedTime || submitting}
                  className="w-full"
                >
                  {submitting
                    ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    : <Clock className="h-4 w-4 mr-2" />}
                  Confirmar Cita
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
