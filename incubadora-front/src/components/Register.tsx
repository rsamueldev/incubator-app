import { useState } from 'react';
import { UserPlus, Mail, Lock, User, ArrowLeft, Eye, EyeOff, Loader2 } from 'lucide-react';
import { register } from '../api/client';

export const Register = ({ onBack, onRegisterSuccess }: any) => {
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [name, setName] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, pass, name);
      alert('Cuenta creada con éxito. Ahora puedes iniciar sesión.');
      onRegisterSuccess();
    } catch (error: any) {
      console.error('Registration error:', error);
      alert(error.response?.data?.message || 'Error al crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#09090b] text-white p-6">
      <div className="w-full max-w-[400px] space-y-8 bg-[#18181b] p-8 rounded-[2.5rem] border border-[#27272a] shadow-2xl">
        <button onClick={onBack} className="text-gray-500 hover:text-emerald-500 flex items-center gap-2 text-xs font-bold uppercase tracking-widest transition-colors">
          <ArrowLeft size={16} /> Volver
        </button>

        <div className="text-center">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center text-emerald-500 mx-auto mb-4 border border-emerald-500/20">
            <UserPlus size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Registro</h1>
          <p className="text-gray-500 text-sm">Crea tu cuenta de Incubadora Pro</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-4 text-gray-500" size={20} />
            <input
              required
              type="text"
              placeholder="Nombre completo"
              className="w-full bg-[#09090b] border border-[#27272a] p-4 pl-12 rounded-2xl focus:border-emerald-500 outline-none transition-all"
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-4 top-4 text-gray-500" size={20} />
            <input
              required
              type="email"
              placeholder="Correo electrónico"
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
            {/* BOTÓN DEL OJITO */}
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-4 text-gray-500 hover:text-emerald-500 transition-colors"
            >
              {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            disabled={loading}
            className="w-full bg-emerald-500 text-black font-black p-4 rounded-2xl hover:bg-emerald-400 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading && <Loader2 className="animate-spin" size={20} />}
            {loading ? 'Creando...' : 'Crear Cuenta'}
          </button>
        </form>
      </div>
    </div>
  );
};