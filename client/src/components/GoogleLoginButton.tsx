import React from 'react';

export default function GoogleLoginButton() {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  const loginWithGoogle = () => {
    window.open(`${API_URL}/auth/google`, '_self');
  };

  return (
    <button
      onClick={loginWithGoogle}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-500"
    >
      Se connecter avec Google
    </button>
  );
}
