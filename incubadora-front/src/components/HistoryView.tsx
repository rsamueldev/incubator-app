import { useEffect, useState } from 'react';
import { getHistory } from '../api/client';
import { ChevronLeft, Clock, Search } from 'lucide-react';

export const HistoryView = ({ onBack, deviceId }: { onBack: () => void, deviceId: string }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const data = await getHistory(deviceId);
        if (data) setLogs(data);
      } catch (e) {
        console.error("Error al cargar historial");
      }
    };
    fetchHistory();
  }, [deviceId]);

  return (
    <div className="flex justify-center bg-[#09090b] min-h-screen text-white">
      <div className="w-full max-w-[450px] bg-[#09090b] border-x border-[#27272a] min-h-screen p-6">
        <header className="flex items-center gap-4 mb-10">
          <button onClick={onBack} className="p-2 bg-[#18181b] rounded-xl text-gray-500 border border-[#27272a]">
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-black">Historial</h2>
        </header>

        <div className="space-y-4">
          {logs.length > 0 ? (
            logs.map((log: any, i) => (
              <div key={i} className="bg-[#18181b] p-5 rounded-[2rem] border border-[#27272a] flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Clock size={20} className="text-emerald-500" />
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold">{new Date(log.created_at).toLocaleTimeString()}</p>
                    <p className="font-bold text-sm">{new Date(log.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-orange-500">{log.temperature}°C</p>
                  <p className="text-xs font-bold text-blue-500">{log.humidity}% HR</p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-24 space-y-4">
              <div className="w-16 h-16 bg-[#18181b] rounded-full flex items-center justify-center mx-auto border border-[#27272a]">
                <Search size={24} className="text-gray-700" />
              </div>
              <p className="text-gray-600 font-bold uppercase text-[10px] tracking-widest">Sin datos registrados</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};