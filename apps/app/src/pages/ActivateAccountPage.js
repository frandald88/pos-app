import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import apiBaseUrl from '../config/api';

const LANDING_URL = process.env.REACT_APP_LANDING_URL || 'http://localhost:3001';

// Iconos para los requisitos de contraseña
const Icons = {
  check: () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  ),
  circle: () => (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
      <circle cx="10" cy="10" r="3" />
    </svg>
  )
};

export default function ActivateAccountPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [activating, setActivating] = useState(false);

  // Validación de contraseña en tiempo real
  const getPasswordValidation = (password) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    };
  };

  const passwordValidation = getPasswordValidation(password);

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) {
      setError('Token de activación no proporcionado');
      setVerifying(false);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(
        `${apiBaseUrl}/api/auth/verify-activation-token/${token}`
      );

      if (response.data.success) {
        setTokenValid(true);
        setUserEmail(response.data.data.email);
        setCompanyName(response.data.data.companyName);
      } else {
        setError(response.data.message || 'Token inválido o expirado');
      }
    } catch (err) {
      console.error('Error verificando token:', err);
      setError(
        err.response?.data?.message ||
        'Error al verificar el token. El link puede haber expirado.'
      );
    } finally {
      setVerifying(false);
      setLoading(false);
    }
  };

  const handleActivateAccount = async (e) => {
    e.preventDefault();
    setError(null);

    // Validaciones
    if (!password || !confirmPassword) {
      setError('Por favor completa todos los campos');
      return;
    }

    // Validar todos los requisitos de contraseña
    if (!passwordValidation.minLength) {
      setError('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!passwordValidation.hasUppercase) {
      setError('La contraseña debe tener al menos una letra mayúscula');
      return;
    }

    if (!passwordValidation.hasLowercase) {
      setError('La contraseña debe tener al menos una letra minúscula');
      return;
    }

    if (!passwordValidation.hasNumber) {
      setError('La contraseña debe tener al menos un número');
      return;
    }

    if (!passwordValidation.hasSpecial) {
      setError('La contraseña debe tener al menos un carácter especial');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setActivating(true);

    try {
      const response = await axios.post(
        `${apiBaseUrl}/api/auth/activate-account`,
        {
          token: token,
          password: password
        }
      );

      if (response.data.success) {
        // Mostrar mensaje de éxito y redirigir a login
        alert('Cuenta activada exitosamente. Ahora puedes iniciar sesión.');
        navigate('/login');
      } else {
        setError(response.data.message || 'Error al activar la cuenta');
      }
    } catch (err) {
      console.error('Error activando cuenta:', err);
      setError(
        err.response?.data?.message ||
        'Error al activar la cuenta. Por favor intenta de nuevo.'
      );
    } finally {
      setActivating(false);
    }
  };

  if (loading || verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto mb-4" style={{ color: '#46546b' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-lg" style={{ color: '#697487' }}>Verificando link de activación...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid || error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f4f6fa' }}>
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#23334e' }}>
              Link Inválido o Expirado
            </h2>
            <p className="mb-6" style={{ color: '#697487' }}>
              {error || 'Este link de activación no es válido o ha expirado.'}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
              >
                Volver al Inicio
              </button>
              <button
                onClick={() => window.location.href = `${LANDING_URL}/#/contact`}
                className="w-full py-3 px-6 rounded-lg font-semibold border-2 transition-all duration-200"
                style={{ borderColor: '#46546b', color: '#46546b' }}
              >
                Contactar Soporte
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#f4f6fa' }}>
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#23334e' }}>
            Activa tu Cuenta
          </h1>
          <p className="text-sm mb-2" style={{ color: '#697487' }}>
            {companyName}
          </p>
          <p className="text-sm" style={{ color: '#697487' }}>
            {userEmail}
          </p>
        </div>

        <form onSubmit={handleActivateAccount} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm" style={{ color: '#1e40af' }}>
              Crea una contraseña segura para tu cuenta. Necesitarás esta contraseña cada vez que inicies sesión.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderColor: '#e5e7eb', color: '#23334e' }}
              placeholder="Crea una contraseña segura"
              required
              disabled={activating}
              minLength={8}
            />
            <div className="mt-2 text-xs">
              <p className="font-medium mb-1" style={{ color: '#46546b' }}>La contraseña debe tener:</p>
              <ul className="space-y-0.5">
                <li className="flex items-center gap-1" style={{ color: passwordValidation.minLength ? '#22c55e' : '#46546b' }}>
                  {passwordValidation.minLength ? Icons.check() : Icons.circle()} Mínimo 8 caracteres
                </li>
                <li className="flex items-center gap-1" style={{ color: passwordValidation.hasUppercase ? '#22c55e' : '#46546b' }}>
                  {passwordValidation.hasUppercase ? Icons.check() : Icons.circle()} Una letra mayúscula (A-Z)
                </li>
                <li className="flex items-center gap-1" style={{ color: passwordValidation.hasLowercase ? '#22c55e' : '#46546b' }}>
                  {passwordValidation.hasLowercase ? Icons.check() : Icons.circle()} Una letra minúscula (a-z)
                </li>
                <li className="flex items-center gap-1" style={{ color: passwordValidation.hasNumber ? '#22c55e' : '#46546b' }}>
                  {passwordValidation.hasNumber ? Icons.check() : Icons.circle()} Un número (0-9)
                </li>
                <li className="flex items-center gap-1" style={{ color: passwordValidation.hasSpecial ? '#22c55e' : '#46546b' }}>
                  {passwordValidation.hasSpecial ? Icons.check() : Icons.circle()} Un carácter especial (!@#$%^&*)
                </li>
              </ul>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
              Confirmar Contraseña
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border-2 focus:outline-none focus:border-blue-500 transition-colors"
              style={{ borderColor: '#e5e7eb', color: '#23334e' }}
              placeholder="Repite tu contraseña"
              required
              disabled={activating}
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={activating}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-75 disabled:cursor-wait disabled:transform-none"
              style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
            >
              {activating ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Activando cuenta...
                </span>
              ) : (
                'Activar Cuenta'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t text-center" style={{ borderColor: '#e5e7eb' }}>
          <p className="text-sm mb-2" style={{ color: '#697487' }}>
            ¿Problemas para activar tu cuenta?
          </p>
          <button
            onClick={() => window.location.href = `${LANDING_URL}/#/contact`}
            className="text-sm font-medium transition-colors duration-200"
            style={{ color: '#46546b' }}
            onMouseEnter={(e) => e.target.style.color = '#23334e'}
            onMouseLeave={(e) => e.target.style.color = '#46546b'}
          >
            Contactar Soporte →
          </button>
        </div>
      </div>
    </div>
  );
}
