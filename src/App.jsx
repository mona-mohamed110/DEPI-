import { RouterProvider } from 'react-router-dom';
import { PrefsProvider } from './context/PrefsContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { router } from './router.jsx';

export default function App() {
  return (
    <PrefsProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </PrefsProvider>
  );
}
