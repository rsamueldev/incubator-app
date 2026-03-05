import { useEffect, useState } from 'react';
import { getAlerts } from '../api/client';
import { ChevronLeft, Bell, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react';

export const NotificationsView = ({ onBack, deviceId }: { onBack: () => void, deviceId: string }) => {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const data = await getAlerts(deviceId);
                setAlerts(data);
            } catch (e) {
                console.error("Error al cargar alertas");
            } finally {
                setLoading(false);
            }
        };
        fetchAlerts();
    }, [deviceId]);

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'TEMP_HIGH':
            case 'TEMP_LOW':
                return <AlertTriangle className="text-orange-500" size={20} />;
            case 'HUMIDITY_LOW':
                return <AlertCircle className="text-blue-500" size={20} />;
            case 'MOTOR_ACTIVE':
                return <Info className="text-emerald-500" size={20} />;
            default:
                return <CheckCircle className="text-gray-500" size={20} />;
        }
    };

    return (
        <div className="flex justify-center bg-[#09090b] min-h-screen text-white">
            <div className="w-full max-w-[450px] bg-[#09090b] border-x border-[#27272a] min-h-screen p-6">
                <header className="flex items-center gap-4 mb-10">
                    <button onClick={onBack} className="p-2 bg-[#18181b] rounded-xl text-gray-500 border border-[#27272a]">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-xl font-black">Notificaciones</h2>
                </header>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-24">
                            <p className="text-gray-500 animate-pulse font-bold uppercase text-[10px] tracking-widest">Cargando alertas...</p>
                        </div>
                    ) : alerts.length > 0 ? (
                        alerts.map((alert: any, i) => (
                            <div key={i} className={`relative p-6 rounded-[2rem] border transition-all ${alert.is_resolved ? 'bg-[#18181b]/50 border-[#27272a]' : 'bg-[#18181b] border-emerald-500/30 shadow-lg shadow-emerald-500/5'}`}>
                                {/* Hora en la esquina superior derecha */}
                                <span className="absolute top-6 right-8 text-[10px] text-gray-500 font-black uppercase tracking-wider">
                                    {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>

                                <div className="flex gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${alert.is_resolved ? 'bg-gray-800' : 'bg-emerald-500/10'}`}>
                                        {getAlertIcon(alert.type)}
                                    </div>
                                    <div className="space-y-1 pr-12">
                                        <p className="font-black text-sm">{alert.type.replace('_', ' ')}</p>
                                        <p className="text-xs text-gray-400 leading-relaxed">{alert.message}</p>
                                        {alert.is_resolved && (
                                            <p className="text-[9px] text-emerald-500 font-black uppercase tracking-wider mt-2 flex items-center gap-1">
                                                <CheckCircle size={10} /> Resuelto
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-24 space-y-4">
                            <div className="w-16 h-16 bg-[#18181b] rounded-full flex items-center justify-center mx-auto border border-[#27272a]">
                                <Bell size={24} className="text-gray-700" />
                            </div>
                            <p className="text-gray-600 font-bold uppercase text-[10px] tracking-widest">Sin notificaciones</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
