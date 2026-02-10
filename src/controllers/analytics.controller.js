const analyticsService = require('../services/analytics.service');

class AnalyticsController {
  async getSummary(req, res) {
    const data = await analyticsService.getSpendSummary();

    res.status(200).json({
      success: true,
      data,
    });
  }

  async getMonthlyTrend(req, res) {
    const data = await analyticsService.getMonthlyTrend();

    res.status(200).json({
      success: true,
      data,
    });
  }

  async getTopSpenders(req, res) {
    const data = await analyticsService.getTopSpenders();

    res.status(200).json({
      success: true,
      data,
    });
  }

  async getViolations(req, res) {
    const data = await analyticsService.getViolationStats();

    res.status(200).json({
      success: true,
      data,
    });
  }

  async getManagerPerformance(req, res) {
    const data = await analyticsService.getManagerPerformance();

    res.status(200).json({
      success: true,
      data,
    });
  }
}

module.exports = new AnalyticsController();
