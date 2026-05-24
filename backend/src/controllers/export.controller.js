const exportService = require('../services/export.service');
const { error } = require('../utils/helpers');

const exportController = {
  async exportJSON(req, res) {
    try {
      const data = await exportService.exportJSON(req.user.id);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="health-data-${new Date().toISOString().split('T')[0]}.json"`
      );
      return res.json(data);
    } catch (err) {
      throw err;
    }
  },

  async exportCSV(req, res) {
    try {
      const { type } = req.params;
      const validTypes = ['sleep', 'steps', 'water', 'exercise', 'diet', 'stress', 'cycle'];
      if (!validTypes.includes(type)) {
        return error(res, 'VALIDATION_ERROR', `type 参数必须是 ${validTypes.join(', ')} 之一`, 400);
      }

      const rows = await exportService.exportCSV(req.user.id, type);

      if (!rows || rows.length === 0) {
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${type}-data.csv"`);
        return res.send('﻿' + Object.keys(rows[0] || {}).join(',') + '\n');
      }

      const headers = Object.keys(rows[0]).filter((k) => k !== 'user_id');
      const bom = '﻿'; // BOM for Excel Chinese support
      const csvRows = [headers.join(',')];

      for (const row of rows) {
        const values = headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return '';
          const str = String(val);
          // Escape commas and quotes
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        });
        csvRows.push(values.join(','));
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${type}-data-${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(bom + csvRows.join('\n'));
    } catch (err) {
      throw err;
    }
  },
};

module.exports = exportController;
