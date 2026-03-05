import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { HistoryView } from './components/HistoryView';
import { getUserDevices, linkDevice } from './api/client';
import { LayoutGrid, Plus, Cpu, LogOut, Loader2 } from 'lucide-react';

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

      {/* ... otras vistas (notificaciones, ajustes) ... */}
      {currentView === 'notifications' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
          <h2 className="text-2xl font-black">Notificaciones</h2>
          <button onClick={() => setCurrentView('dashboard')} className="mt-10 bg-[#18181b] px-10 py-4 rounded-2xl border border-[#27272a] font-bold text-xs uppercase">Volver</button>
        </div>
      )}

      {currentView === 'settings' && (
        <div className="max-w-[450px] mx-auto p-8">
          <header className="mb-10">
            <h2 className="text-3xl font-black">Configuración</h2>
          </header>
          <div className="p-6 bg-[#18181b] rounded-[2rem] border border-[#27272a] mb-4">
            <p className="font-bold">Usuario</p>
            <p className="text-xs text-gray-500">Sesión iniciada correctamente</p>
          </div>
          <button onClick={handleLogout} className="w-full bg-red-500/10 text-red-500 font-black py-4 rounded-2xl border border-red-500/20 mb-4">CERRAR SESIÓN</button>
          <button onClick={() => setCurrentView('dashboard')} className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl">VOLVER</button>
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