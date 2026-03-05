import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { HistoryView } from './components/HistoryView';
import { NotificationsView } from './components/NotificationsView';
import { getUserDevices, linkDevice } from './api/client';
import { Plus, Cpu, Loader2, LogOut, Bell, ShieldCheck, Thermometer } from 'lucide-react';

function App() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(true);

  // --- ESTADOS DE DISPOSITIVO ---
  const [devices, setDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<any>(null);

  // --- ESTADOS DE NAVEGACIÓN ---
  const [currentView, setCurrentView] = useState('dashboard');

  // --- ESTADOS DE CONFIGURACIÓN ---
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [tempLimit, setTempLimit] = useState(38.5);

  /**
   * NOTA: El mantenimiento de la base de datos (limpieza de lecturas y alertas antiguas)
   * se realiza automáticamente en el servidor (Backend) mediante tareas CRON 
   * configuradas a las 12:00 AM (Midnight).
   */

  // Verificar sesión al cargar
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      setIsAuthenticated(true);
      fetchDevices();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const userDevices = await getUserDevices();
      setDevices(userDevices);
      if (userDevices.length > 0) {
        setSelectedDevice(userDevices[0]);
      }
    } catch (error) {
      console.error('Error fetching devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    fetchDevices();
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setDevices([]);
    setSelectedDevice(null);
    setAuthMode('login');
  };

  // Pantalla de carga inicial
  if (loading && isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
      </div>
    );
  }

  // Lógica para mostrar Login o Registro si no está autenticado
  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login
        onLogin={handleLoginSuccess}
        onGoToRegister={() => setAuthMode('register')}
      />
    ) : (
      <Register
        onBack={() => setAuthMode('login')}
        onRegisterSuccess={() => setAuthMode('login')}
      />
    );
  }

  // --- RENDERIZADO DE VISTAS DEL PANEL ---
  return (
    <div className="bg-[#09090b] min-h-screen text-white">

      {/* 1. Vista de Panel Principal */}
      {currentView === 'dashboard' && (
        <>
          {devices.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
                <Cpu className="text-emerald-500" size={32} />
              </div>
              <h2 className="text-2xl font-black">No hay dispositivos</h2>
              <p className="text-gray-500 mt-2 text-sm max-w-xs">
                Parece que no tienes ninguna incubadora vinculada a tu cuenta.
              </p>
              <button
                onClick={() => setCurrentView('link_device')}
                className="mt-10 bg-emerald-500 text-black px-10 py-4 rounded-2xl font-black text-sm flex items-center gap-2"
              >
                <Plus size={20} />
                VINCULAR AHORA
              </button>
              <button onClick={handleLogout} className="mt-4 text-gray-500 font-bold text-xs uppercase hover:text-red-500 transition-colors">
                Cerrar Sesión
              </button>
            </div>
          ) : (
            <Dashboard
              onLogout={handleLogout}
              setView={setCurrentView}
              selectedDevice={selectedDevice}
              devices={devices}
              onSelectDevice={setSelectedDevice}
            />
          )}
        </>
      )}

      {/* 2. Vista de Historial */}
      {currentView === 'history' && selectedDevice && (
        <HistoryView
          deviceId={selectedDevice.device_id}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {/* 3. Vista de Vinculación de Dispositivo */}
      {currentView === 'link_device' && (
        <DeviceLinker
          onSuccess={() => {
            fetchDevices();
            setCurrentView('dashboard');
          }}
          onCancel={() => setCurrentView('dashboard')}
        />
      )}

      {/* 4. Vista de Notificaciones REAL */}
      {currentView === 'notifications' && selectedDevice && (
        <NotificationsView
          deviceId={selectedDevice.device_id}
          onBack={() => setCurrentView('dashboard')}
        />
      )}

      {/* 5. Vista de Ajustes Funcional */}
      {currentView === 'settings' && (
        <div className="flex justify-center bg-[#09090b] min-h-screen text-white">
          <div className="w-full max-w-[450px] bg-[#09090b] border-x border-[#27272a] min-h-screen p-8 animate-in slide-in-from-right duration-500">
            <header className="mb-10 flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black">Configuración</h2>
                <p className="text-gray-500 text-sm italic">Personaliza tu terminal</p>
              </div>
              <button onClick={handleLogout} className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">
                <LogOut size={20} />
              </button>
            </header>

            <div className="space-y-6">
              {/* Perfil Simple */}
              <div className="p-6 bg-[#18181b] rounded-[2.5rem] border border-[#27272a] flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <p className="font-black text-sm">Estado de Cuenta</p>
                  <p className="text-[10px] text-gray-500 uppercase font-black">Sincronizado con Supabase</p>
                </div>
              </div>

              {/* Interruptor de Alertas */}
              <div
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                className={`p-6 bg-[#18181b] rounded-[2.5rem] border transition-all cursor-pointer flex justify-between items-center ${alertsEnabled ? 'border-emerald-500/30' : 'border-[#27272a] opacity-60'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${alertsEnabled ? 'bg-emerald-500 text-black' : 'bg-gray-800 text-gray-500'}`}>
                    <Bell size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Alertas del Sistema</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Notificaciones Push</p>
                  </div>
                </div>
                <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${alertsEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-gray-800'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${alertsEnabled ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>

              {/* Ajuste de Límite (Visual) */}
              <div className="p-6 bg-[#18181b] rounded-[2.5rem] border border-[#27272a] flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                    <Thermometer size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Límite Crítico</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Temperatura Máxima</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-500 font-black text-xl">{tempLimit}°C</span>
                </div>
              </div>

              {/* Cerrar Sesión Secundario */}
              <div
                onClick={handleLogout}
                className="p-6 bg-[#18181b] rounded-[2.5rem] border border-[#27272a] flex justify-between items-center cursor-pointer hover:bg-red-500/5 group transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                    <LogOut size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Cerrar Sesión</p>
                    <p className="text-[10px] text-gray-500 uppercase font-black">Desconectar cuenta</p>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setCurrentView('dashboard')}
              className="w-full mt-10 bg-emerald-500 text-black font-black py-5 rounded-3xl shadow-xl shadow-emerald-500/10 hover:scale-[1.02] active:scale-95 transition-all"
            >
              VOLVER AL PANEL
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Sub-componente rápido para vincular
const DeviceLinker = ({ onSuccess, onCancel }: any) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await linkDevice(id, name);
      onSuccess();
    } catch (e) {
      alert('Error al vincular: Verifica el ID del dispositivo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="w-full max-w-sm bg-[#18181b] p-8 rounded-[2.5rem] border border-[#27272a]">
        <h2 className="text-2xl font-black mb-6">Vincular Incubadora</h2>
        <form onSubmit={handleLink} className="space-y-4">
          <input
            required
            placeholder="ID del Dispositivo (ej: MAC)"
            className="w-full bg-[#09090b] border border-[#27272a] p-4 rounded-2xl outline-none focus:border-emerald-500"
            onChange={e => setId(e.target.value)}
          />
          <input
            required
            placeholder="Nombre (ej: Incubadora 1)"
            className="w-full bg-[#09090b] border border-[#27272a] p-4 rounded-2xl outline-none focus:border-emerald-500"
            onChange={e => setName(e.target.value)}
          />
          <button className="w-full bg-emerald-500 text-black font-black p-4 rounded-2xl disabled:opacity-50" disabled={loading}>
            {loading ? 'Vinculando...' : 'VINCULAR'}
          </button>
          <button type="button" onClick={onCancel} className="w-full text-gray-500 font-bold text-xs uppercase py-2">Cancelar</button>
        </form>
      </div>
    </div>
  );
};

export default App;