import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  const getPasswordValidation = (password) => {
    return {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)
    };
  };

  const passwordValidation = getPasswordValidation(formData.newPassword);
  const allRequirementsMet = Object.values(passwordValidation).every(v => v);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage({ type: '', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    // Validaciones
    if (!allRequirementsMet) {
      setMessage({ type: 'error', text: 'La contraseña no cumple todos los requisitos' });
      setLoading(false);
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/change-password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({ type: 'error', text: data.message || 'Error al cambiar contraseña' });
        setLoading(false);
        return;
      }

      // Actualizar el usuario en localStorage para quitar mustChangePassword
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      userData.mustChangePassword = false;
      localStorage.setItem('user', JSON.stringify(userData));

      setMessage({ type: 'success', text: 'Contraseña actualizada exitosamente' });

      // Redirigir al dashboard después de un momento
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (error) {
      console.error('Error:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f4f6fa' }}>
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ backgroundColor: '#fef3c7' }}>
              <svg className="w-8 h-8" style={{ color: '#f59e0b' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold" style={{ color: '#23334e' }}>
              Cambiar Contraseña
            </h1>
            <p className="mt-2" style={{ color: '#697487' }}>
              Por seguridad, debes cambiar tu contraseña temporal antes de continuar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contraseña Actual */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                Contraseña Actual (Temporal)
              </label>
              <input
                type="password"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#46546b' }}
                placeholder="Ingresa tu contraseña temporal"
              />
            </div>

            {/* Nueva Contraseña */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                Nueva Contraseña
              </label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#46546b' }}
                placeholder="Crea una contraseña segura"
              />

              {/* Requisitos de contraseña */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center text-sm">
                  <span className={`mr-2 ${passwordValidation.minLength ? 'text-green-500' : 'text-gray-400'}`}>
                    {passwordValidation.minLength ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordValidation.minLength ? '#22c55e' : '#9ca3af' }}>
                    Mínimo 8 caracteres
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className={`mr-2 ${passwordValidation.hasUppercase ? 'text-green-500' : 'text-gray-400'}`}>
                    {passwordValidation.hasUppercase ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordValidation.hasUppercase ? '#22c55e' : '#9ca3af' }}>
                    Una letra mayúscula
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className={`mr-2 ${passwordValidation.hasLowercase ? 'text-green-500' : 'text-gray-400'}`}>
                    {passwordValidation.hasLowercase ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordValidation.hasLowercase ? '#22c55e' : '#9ca3af' }}>
                    Una letra minúscula
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className={`mr-2 ${passwordValidation.hasNumber ? 'text-green-500' : 'text-gray-400'}`}>
                    {passwordValidation.hasNumber ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordValidation.hasNumber ? '#22c55e' : '#9ca3af' }}>
                    Un número
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className={`mr-2 ${passwordValidation.hasSpecial ? 'text-green-500' : 'text-gray-400'}`}>
                    {passwordValidation.hasSpecial ? '✓' : '○'}
                  </span>
                  <span style={{ color: passwordValidation.hasSpecial ? '#22c55e' : '#9ca3af' }}>
                    Un carácter especial (!@#$%^&*)
                  </span>
                </div>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#23334e' }}>
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': '#46546b' }}
                placeholder="Repite tu nueva contraseña"
              />
              {formData.confirmPassword && formData.newPassword !== formData.confirmPassword && (
                <p className="text-sm mt-1 text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>

            {/* Mensaje de error/éxito */}
            {message.text && (
              <div
                className="rounded-lg border p-4"
                style={{
                  backgroundColor: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
                  borderColor: message.type === 'error' ? '#fecaca' : '#bbf7d0'
                }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: message.type === 'error' ? '#dc2626' : '#16a34a' }}
                >
                  {message.text}
                </p>
              </div>
            )}

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={loading || !allRequirementsMet}
              className="w-full py-3 px-6 rounded-lg font-semibold text-white transition-all duration-200 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #46546b 0%, #23334e 100%)' }}
            >
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePasswordPage;
