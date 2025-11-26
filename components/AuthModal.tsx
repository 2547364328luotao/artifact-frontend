import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!username || !password) {
        setError('错误：字段不能为空');
        setIsSubmitting(false);
        return;
    }

    try {
      let err;
      if (isLogin) {
        err = await login(username, password);
      } else {
        err = await register(username, password);
      }

      if (err) {
        setError(err);
      } else {
        onClose();
      }
    } catch (e) {
      setError('系统故障 (CRITICAL_ERROR)');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-slate-900 border-4 border-slate-700 w-full max-w-md shadow-[16px_16px_0px_0px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-slate-800 p-3 border-b-4 border-slate-700 flex justify-between items-center">
            <span className="text-neon-pink font-sans font-bold tracking-widest text-sm uppercase">
                {'>>'} {isLogin ? '安全网关 (LOGIN)' : '用户注册 (REGISTER)'}
            </span>
            <button onClick={onClose} className="text-slate-400 hover:text-white font-mono-retro text-xl leading-none">X</button>
        </div>

        {/* Content */}
        <div className="p-8">
            <div className="flex justify-center mb-8">
                <div className="w-16 h-16 border-2 border-neon-blue rounded-full flex items-center justify-center bg-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.3)]">
                    <span className="text-3xl animate-pulse">🔒</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-neon-green font-mono-retro text-xs mb-2 uppercase tracking-wider">{'>'} 用户代号 (USERNAME)</label>
                    <input 
                        type="text" 
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-slate-950 border-2 border-slate-700 p-3 text-white font-sans focus:border-neon-green focus:outline-none transition-colors"
                        placeholder="输入 ID..."
                    />
                </div>
                
                <div>
                    <label className="block text-neon-green font-mono-retro text-xs mb-2 uppercase tracking-wider">{'>'} 访问密钥 (PASSWORD)</label>
                    <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-950 border-2 border-slate-700 p-3 text-white font-sans focus:border-neon-green focus:outline-none transition-colors"
                        placeholder="******"
                    />
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500 text-red-500 p-2 text-xs font-mono-retro text-center">
                        {'>'} {error}
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 font-sans font-bold tracking-widest text-base uppercase border-2 transition-all
                        ${isSubmitting 
                            ? 'bg-slate-700 border-slate-700 text-slate-400 cursor-not-allowed' 
                            : 'bg-neon-green border-neon-green text-black hover:bg-white hover:border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] active:translate-y-1 active:shadow-none'}
                    `}
                >
                    {isSubmitting ? '正在握手...' : (isLogin ? '建立连接' : '注册身份')}
                </button>
            </form>

            <div className="mt-6 text-center">
                <button 
                    onClick={() => { setError(null); setIsLogin(!isLogin); }}
                    className="text-slate-500 hover:text-neon-blue font-mono-retro text-sm underline decoration-dotted underline-offset-4"
                >
                    {isLogin ? '> 没有账号？申请访问权限' : '> 已有权限？直接接入'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;