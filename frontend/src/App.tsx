import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';

import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CadastroUsuarios from './pages/CadastroUsuarios';
import GestaoUsuarios from './pages/GestaoUsuarios';
import ListaCatalogo from './pages/ListaCatalogo';
import CadastroCatalogo from './pages/CadastroCatalogo';
import EditarCatalogo from './pages/EditarCatalogo';
import ListaFuncionarios from './pages/ListaFuncionarios';
import CadastroFuncionario from './pages/CadastroFuncionario';
import EditarFuncionario from './pages/EditarFuncionario';
import AtribuirResponsabilidade from './pages/AtribuirResponsabilidade';

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <Routes>
      <Route 
        path="/login" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} 
      />
      <Route 
        path="/register" 
        element={isAuthenticated ? <Navigate to="/dashboard" /> : <Register />} 
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="cadastro-usuarios" element={<CadastroUsuarios />} />
        <Route path="gestao-usuarios" element={<GestaoUsuarios />} />
        <Route path="catalogo" element={<ListaCatalogo />} />
        <Route path="cadastrar-catalogo" element={<CadastroCatalogo />} />
        <Route path="editar-catalogo/:id" element={<EditarCatalogo />} />
        <Route path="funcionarios" element={<ListaFuncionarios />} />
        <Route path="cadastrar-funcionario" element={<CadastroFuncionario />} />
        <Route path="editar-funcionario/:id" element={<EditarFuncionario />} />
        <Route path="atribuir-responsabilidade" element={<AtribuirResponsabilidade />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;

