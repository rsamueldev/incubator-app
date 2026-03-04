import { useState } from 'react';
import { LogIn, ShieldCheck, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export const Login = ({ onLogin, onGoToRegister }: any) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Obtenemos los datos que se guardaron en el Registro
    const savedEmail = localStorage.getItem('userEmail');
    const savedPass = localStorage.getItem('userPass');

    // Validamos: Si coincide con el guardado O con el admin por defecto
    if ((email === savedEmail && pass === savedPass) || (email === 'admin@test.com' && pass === '1234')) { 
      onLogin();
    } else {
      alert('Correo o contraseña incorrectos. ¿Ya te registraste?');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white p-6">
      <div className="w-full max-w-[400px] space-y-8 bg-[#18181b] p-8 rounded-[2.5rem] border border-[#27272a] shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center text-black mx-auto mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Ingresar</h1>
          <p className="text-gray-500 text-sm">Panel de Control de Incubadora</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-500" size={20} />
            <input 
              required
              type="email" 
              placeholder="Correo" 
              className="w-full bg-[#09090b] border border-[#27272a] p-4 pl-12 rounded-2xl focus:border-emerald-500 outline-none transition-all" 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 text-gray-500" size={20} />
            <input 
              required
              type={showPass ? "text" : "password"} 
              placeholder="Contraseña" 
              className="w-full bg-[#09090b] border border-[#27272a] p-4 pl-12 pr-12 rounded-2xl focus:border-emerald-500 outline-none transition-all" 
              onChange={(e) => setPass(e.target.value)} 
            />
            <button 
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-4 text-gray-500 hover:text-emerald-500"
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          
          <button className="w-full bg-emerald-500 text-black font-black p-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-400 active:scale-95 transition-all">
            <LogIn size={20} />
            <span>Entrar</span>
          </button>
        </form>

        <button 
          onClick={onGoToRegister} 
          className="w-full text-xs font-bold text-gray-500 uppercase tracking-widest hover:text-emerald-500 transition-colors"
        >
          ¿No tienes cuenta? Regístrate aquí
        </button>
      </div>
    </div>
  );
};