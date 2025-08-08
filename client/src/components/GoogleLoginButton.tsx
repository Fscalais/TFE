import React from 'react';

export default function GoogleLoginButton() {
  const loginWithGoogle = () => {
    window.open('http://localhost:5000/auth/google', '_self');
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

