import * as dashboardModel from '../models/dashboardModel.js';

/**
 * Controller para buscar estatísticas do dashboard
 */
export const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardModel.getDashboardStats();
    res.json(stats);
  } catch (error) {
    next(error);
  }
};

