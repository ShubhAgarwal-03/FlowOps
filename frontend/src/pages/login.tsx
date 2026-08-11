import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-semibold">M</div>
          <div>
            <div className="font-semibold text-slate-800">Mini ERP</div>
            <div className="text-xs text-slate-400">Operations Portal</div>
          </div>
        </div>

        <label className="block text-sm font-medium text-slate-600 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        <label className="block text-sm font-medium text-slate-600 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-3 py-2 border border-slate-200 rounded-md text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />

        {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-md py-2"
        >
          {loading ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  );
}