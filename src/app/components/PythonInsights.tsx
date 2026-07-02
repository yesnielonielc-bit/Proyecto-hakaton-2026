import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { TrendingUp, AlertCircle, Loader2, Cpu } from 'lucide-react';

interface PythonReport {
  total_orders: number;
  monthly_revenue: Record<string, number>;
  cancellation_rate: number;
  generated_at: string;
}

interface PythonInsightsProps {
  sellerId: string;
}

const PYTHON_API_URL = import.meta.env.VITE_PYTHON_API_URL || 'http://localhost:8000';

export function PythonInsights({ sellerId }: PythonInsightsProps) {
  const [report, setReport] = useState<PythonReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sellerId) return;
    fetchReport();
  }, [sellerId]);

  const fetchReport = async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch(`${PYTHON_API_URL}/api/seller-report/${sellerId}`);
      if (!res.ok) throw new Error('Error en la respuesta');
      const data = await res.json();
      setReport(data);
    } catch (err) {
      console.error('Error conectando al backend Python:', err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const months = report?.monthly_revenue ? Object.entries(report.monthly_revenue) : [];
  const maxRevenue = months.length > 0 ? Math.max(...months.map(([, v]) => v)) : 1;

  return (
    <Card className="border-0 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-indigo-50 rounded-xl flex items-center justify-center">
          <Cpu className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Análisis Avanzado</h2>
          <p className="text-xs text-gray-400">Procesado con Python (pandas)</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
        </div>
      ) : error ? (
        <div className="flex items-start gap-2 bg-amber-50 text-amber-700 text-sm p-3 rounded-xl">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>
            No se pudo conectar al servicio de análisis. Verifica que el backend
            Python esté disponible.
          </span>
        </div>
      ) : report ? (
        <div className="space-y-4">
          {/* Tasa de cancelación */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
            <span className="text-sm text-gray-600">Tasa de cancelación</span>
            <span className={`font-bold text-sm ${
              report.cancellation_rate > 20 ? 'text-red-600' : report.cancellation_rate > 5 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {report.cancellation_rate}%
            </span>
          </div>

          {/* Ingresos por mes */}
          {months.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-indigo-500" /> Ingresos por mes
              </p>
              <div className="space-y-2">
                {months.map(([month, revenue]) => (
                  <div key={month}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-600">{month}</span>
                      <span className="font-semibold text-indigo-600">${revenue.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all"
                        style={{ width: `${(revenue / maxRevenue) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-4">Sin datos suficientes aún</p>
          )}
        </div>
      ) : null}
    </Card>
  );
}