import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';

/**
 * Hook personalizado para verificar se o usuário atual é ADMIN
 * Verifica tanto profile_id numérico quanto string para garantir compatibilidade
 */
export const useIsAdmin = (): boolean => {
  const user = useSelector((state: RootState) => state.auth.user);
  
  return useMemo(() => {
    if (!user || !user.profile_id) {
      return false;
    }
    
    // Verifica se profile_id é 1 (numérico ou string)
    const profileId = user.profile_id;
    const isAdmin = profileId === 1 || Number(profileId) === 1 || String(profileId) === '1';
    
    // Debug em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('🔍 useIsAdmin - User:', user);
      console.log('🔍 useIsAdmin - profile_id:', profileId, 'Type:', typeof profileId);
      console.log('🔍 useIsAdmin - isAdmin:', isAdmin);
    }
    
    return isAdmin;
  }, [user]);
};

