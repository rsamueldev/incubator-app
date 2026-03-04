import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { HistoryView } from './components/HistoryView';

function App() {
  // --- ESTADOS DE AUTENTICACIÓN ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // --- ESTADOS DE NAVEGACIÓN ---
  const [currentView, setCurrentView] = useState('dashboard');

  // --- ESTADOS DE CONFIGURACIÓN (FUNCIONALES) ---
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [tempLimit, setTempLimit] = useState(38.5);

  // Lógica para mostrar Login o Registro si no está autenticado
  if (!isAuthenticated) {
    return authMode === 'login' ? (
      <Login 
        onLogin={() => setIsAuthenticated(true)} 
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
        <Dashboard 
          onLogout={() => {
            setIsAuthenticated(false);
            setAuthMode('login');
          }} 
          setView={setCurrentView} 
        />
      )}
      
      {/* 2. Vista de Historial (Separada) */}
      {currentView === 'history' && (
        <HistoryView onBack={() => setCurrentView('dashboard')} />
      )}

      {/* 3. Vista de Notificaciones */}
      {currentView === 'notifications' && (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center animate-in fade-in">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
            <span className="text-emerald-500 text-3xl">🔔</span>
          </div>
          <h2 className="text-2xl font-black">Notificaciones</h2>
          <p className="text-gray-500 mt-2 text-sm">
            {alertsEnabled ? 'El sistema de alertas está activo.' : 'Las alertas están desactivadas.'}
          </p>
          <button 
            onClick={() => setCurrentView('dashboard')}
            className="mt-10 bg-[#18181b] px-10 py-4 rounded-2xl border border-[#27272a] font-bold text-xs uppercase tracking-widest"
          >
            Volver
          </button>
        </div>
      )}

      {/* 4. Vista de Ajustes (Con Alertas Funcionales) */}
      {currentView === 'settings' && (
        <div className="max-w-[450px] mx-auto p-8 animate-in slide-in-from-right duration-500">
          <header className="mb-10">
            <h2 className="text-3xl font-black">Configuración</h2>
            <p className="text-gray-500 text-sm">Personaliza tu incubadora</p>
          </header>
          
          <div className="space-y-4">
            {/* Interruptor de Alertas */}
            <div 
              onClick={() => setAlertsEnabled(!alertsEnabled)}
              className="p-6 bg-[#18181b] rounded-[2rem] border border-[#27272a] flex justify-between items-center cursor-pointer transition-all active:scale-95"
            >
              <div>
                <p className="font-bold">Alertas de Temperatura</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">
                  {alertsEnabled ? 'Estado: Activado' : 'Estado: Desactivado'}
                </p>
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${alertsEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-gray-700'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 ${alertsEnabled ? 'right-1' : 'left-1'}`}></div>
              </div>
            </div>

            {/* Ajuste de Límite (Visual) */}
            <div className="p-6 bg-[#18181b] rounded-[2rem] border border-[#27272a] flex justify-between items-center">
              <div>
                <p className="font-bold">Límite Crítico</p>
                <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">Temperatura máxima</p>
              </div>
              <div className="flex items-center gap-3">
                 <span className="text-emerald-500 font-black text-lg">{tempLimit}°C</span>
              </div>
            </div>

            {/* Opción de Soporte */}
            <div className="p-6 bg-[#18181b] rounded-[2rem] border border-[#27272a] opacity-40">
              <p className="font-bold text-sm">Calibración de Sensores</p>
              <p className="text-[10px] uppercase font-bold">Próximamente</p>
            </div>
          </div>

          <button 
            onClick={() => setCurrentView('dashboard')}
            className="w-full mt-12 bg-emerald-500 text-black font-black py-5 rounded-2xl shadow-xl shadow-emerald-500/10 hover:bg-emerald-400 transition-all active:scale-95"
          >
            GUARDAR Y CERRAR
          </button>
        </div>
      )}
    </div>
  );
}

export default App;