import { useEffect, useState } from 'react';
import { 
  Thermometer, Droplets, LayoutGrid, Clock, 
  Bell, Settings, LogOut, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, 
  Tooltip, ResponsiveContainer, CartesianGrid 
} from 'recharts';
import { getLatestReading, getHistory } from '../api/client';

export const Dashboard = ({ onLogout, setView }: any) => {
  const [latest, setLatest] = useState<any>(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const update = async () => {
      try {
        const current = await getLatestReading('1'); 
        const past = await getHistory('1');
        if (current) setLatest(current);
        if (past) setHistory(past);
      } catch (e) {
        setLatest(null); 
      }
    };
    update();
    const timer = setInterval(update, 5000); 
    return () => clearInterval(timer);
  }, []);

  const staticData = [
    { temperature: 0 }, { temperature: 0 }, { temperature: 0 }, 
    { temperature: 0 }, { temperature: 0 }
  ];

  return (
    <div className="flex justify-center bg-[#09090b] min-h-screen text-white">
      <div className="w-full max-w-[450px] bg-[#09090b] relative border-x border-[#27272a] pb-24 shadow-2xl">
        
        {/* Encabezado Simple */}
        <header className="p-6 flex justify-between items-center sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-black font-black">I</div>
            <div>
              <h1 className="font-bold text-sm leading-none">Incubadora Pro</h1>
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Estado: En Vivo</span>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 text-gray-600 hover:text-red-500 transition-all">
            <LogOut size={18} />
          </button>
        </header>

        <main className="px-6 space-y-6 mt-2 animate-in fade-in duration-700">
          <header>
            <h2 className="text-3xl font-black tracking-tight">Panel de Control</h2>
            <p className="text-gray-500 text-sm">Visualización de parámetros actuales.</p>
          </header>

          {/* Tarjetas de Sensores Grandes */}
          <div className="grid grid-cols-1 gap-4">
            <div className="bg-gradient-to-br from-orange-600 to-rose-600 p-6 rounded-[2.5rem] flex justify-between items-center shadow-lg shadow-orange-900/20">
              <div>
                <p className="text-xs font-bold uppercase opacity-80 mb-1">Temperatura</p>
                <h3 className="text-5xl font-black">{latest?.temperature ? `${latest.temperature}°C` : '0.0°C'}</h3>
              </div>
              <Thermometer size={48} className="opacity-30" />
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[2.5rem] flex justify-between items-center shadow-lg shadow-blue-900/20">
              <div>
                <p className="text-xs font-bold uppercase opacity-80 mb-1">Humedad Relativa</p>
                <h3 className="text-5xl font-black">{latest?.humidity ? `${latest.humidity}%` : '0%'}</h3>
              </div>
              <Droplets size={48} className="opacity-30" />
            </div>
          </div>

          {/* Gráfico de Historial más grande */}
          <section className="bg-[#18181b] p-6 rounded-[2.5rem] border border-[#27272a]">
             <div className="flex items-center gap-2 mb-6">
                <Activity size={16} className="text-emerald-500" />
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gráfica de Tendencia</h4>
             </div>
             
             <div className="h-56 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={history.length > 0 ? history : staticData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" opacity={0.3} />
                   <XAxis dataKey="created_at" hide />
                   <YAxis hide domain={[0, 50]} />
                   <Tooltip 
                     contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px' }}
                     itemStyle={{ color: '#10b981' }}
                   />
                   <Area 
                    type="monotone" 
                    dataKey="temperature" 
                    stroke="#1fd655" 
                    strokeWidth={3} 
                    fill="rgba(31, 214, 85, 0.05)" 
                    isAnimationActive={true}
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
             <p className="text-center text-[10px] text-gray-600 font-bold mt-4 uppercase tracking-[0.2em]">Monitoreo de Fase 1 Activo</p>
          </section>
        </main>

        {/* Navegación Inferior */}
        <nav className="fixed bottom-0 w-full max-w-[450px] bg-[#09090b]/90 backdrop-blur-xl border-t border-[#27272a] px-10 py-6 flex justify-between rounded-b-[2rem]">
          <LayoutGrid className="text-emerald-500 cursor-pointer" onClick={() => setView('dashboard')} />
          <Clock className="text-gray-600 hover:text-emerald-500 transition-colors" onClick={() => setView('history')} />
          <Bell className="text-gray-600 hover:text-emerald-500 transition-colors" onClick={() => setView('notifications')} />
          <Settings className="text-gray-600 hover:text-emerald-500 transition-colors" onClick={() => setView('settings')} />
        </nav>
      </div>
    </div>
  );
};