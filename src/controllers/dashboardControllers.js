const Income = require('../models/Income');
const Outcome = require('../models/Outcome');
const ItemOutcome = require('../models/ItemOutcome');
const ItemIncome = require('../models/ItemIncome');
const dayjs = require('dayjs');
const { formatResponse } = require('../utils/formatResponse');

const getIncomeSummary = async (req, res) => {
  // return formatResponse(res, 200, 'Income summary retrieved', {
  //   "type": "today",
  //   "current": {
  //     "fromDate": "2025-08-22T17:00:00.000Z",
  //     "toDate": "2025-08-23T16:59:59.999Z",
  //     "total": 99999
  //   },
  //   "previous": {
  //     "fromDate": "2025-08-21T17:00:00.000Z",
  //     "toDate": "2025-08-22T16:59:59.999Z",
  //     "total": 999999
  //   }
  // });
  try {
    const { type } = req.params;

    if (!['today', '7days', '30days'].includes(type)) {
      return formatResponse(res, 400, 'Invalid type. Use today, 7days, or 30days', null);
    }

    const now = dayjs();
    let currentFrom, currentTo, previousFrom, previousTo;

    if (type === 'today') {
      currentFrom = now.startOf('day');
      currentTo = now.endOf('day');
      previousFrom = currentFrom.subtract(1, 'day');
      previousTo = currentTo.subtract(1, 'day');
    } else if (type === '7days') {
      currentFrom = now.subtract(6, 'day').startOf('day');
      currentTo = now.endOf('day');
      previousFrom = currentFrom.subtract(7, 'day');
      previousTo = currentFrom.subtract(1, 'second');
    } else if (type === '30days') {
      currentFrom = now.subtract(29, 'day').startOf('day');
      currentTo = now.endOf('day');
      previousFrom = currentFrom.subtract(30, 'day');
      previousTo = currentFrom.subtract(1, 'second');
    }

    const [currentAgg, previousAgg] = await Promise.all([
      Income.aggregate([
        {
          $match: {
            createdAt: { $gte: currentFrom.toDate(), $lte: currentTo.toDate() }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]),
      Income.aggregate([
        {
          $match: {
            createdAt: { $gte: previousFrom.toDate(), $lte: previousTo.toDate() }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ])
    ]);

    return formatResponse(res, 200, 'Income summary retrieved', {
      type,
      current: {
        fromDate: currentFrom.toDate(),
        toDate: currentTo.toDate(),
        total: currentAgg[0]?.total || 0
      },
      previous: {
        fromDate: previousFrom.toDate(),
        toDate: previousTo.toDate(),
        total: previousAgg[0]?.total || 0
      }
    });
  } catch (err) {
    return formatResponse(res, 500, 'Failed to get income summary', { error: err.message });
  }
};

// const getIncomeCountSummary = async (req, res) => {
//   try {
//     const { type } = req.params;

//     if (!['today', '7days', '30days'].includes(type)) {
//       return formatResponse(res, 400, 'Invalid type. Use today, 7days, or 30days', null);
//     }

//     const now = dayjs();
//     let currentFrom, currentTo, previousFrom, previousTo;

//     if (type === 'today') {
//       currentFrom = now.startOf('day');
//       currentTo = now.endOf('day');
//       previousFrom = currentFrom.subtract(1, 'day');
//       previousTo = currentTo.subtract(1, 'day');
//     } else if (type === '7days') {
//       currentFrom = now.subtract(6, 'day').startOf('day');
//       currentTo = now.endOf('day');
//       previousFrom = currentFrom.subtract(7, 'day');
//       previousTo = currentFrom.subtract(1, 'second');
//     } else if (type === '30days') {
//       currentFrom = now.subtract(29, 'day').startOf('day');
//       currentTo = now.endOf('day');
//       previousFrom = currentFrom.subtract(30, 'day');
//       previousTo = currentFrom.subtract(1, 'second');
//     }

//     const [currentCount, previousCount] = await Promise.all([
//       Income.countDocuments({
//         createdAt: { $gte: currentFrom.toDate(), $lte: currentTo.toDate() }
//       }),
//       Income.countDocuments({
//         createdAt: { $gte: previousFrom.toDate(), $lte: previousTo.toDate() }
//       })
//     ]);

//     return formatResponse(res, 200, 'Income count summary retrieved', {
//       type,
//       current: {
//         fromDate: currentFrom.toDate(),
//         toDate: currentTo.toDate(),
//         total: currentCount
//       },
//       previous: {
//         fromDate: previousFrom.toDate(),
//         toDate: previousTo.toDate(),
//         total: previousCount
//       }
//     });
//   } catch (err) {
//     return formatResponse(res, 500, 'Failed to get income count summary', { error: err.message });
//   }
// };

const getIncomeCountSummary = async (req, res) => {
  // return formatResponse(res, 200, 'Outcome count summary retrieved', {
  //   type: '7days',
  //   current: {
  //     fromDate: new Date('2025-08-17T00:00:00.000Z'),
  //     toDate: new Date('2025-08-23T23:59:59.999Z'),
  //     total: 42
  //   },
  //   previous: {
  //     fromDate: new Date('2025-08-10T00:00:00.000Z'),
  //     toDate: new Date('2025-08-16T23:59:59.999Z'),
  //     total: 50
  //   },
  //   detail: [
  //     { date: new Date('2025-08-17T00:00:00.000Z'), total: 5 },
  //     { date: new Date('2025-08-18T00:00:00.000Z'), total: 3 },
  //     { date: new Date('2025-08-19T00:00:00.000Z'), total: 8 },
  //     { date: new Date('2025-08-20T00:00:00.000Z'), total: 6 },
  //     { date: new Date('2025-08-21T00:00:00.000Z'), total: 7 },
  //     { date: new Date('2025-08-22T00:00:00.000Z'), total: 4 },
  //     { date: new Date('2025-08-23T00:00:00.000Z'), total: 9 }
  //   ]
  // });
  try {
    const { type } = req.params;

    if (!['3days', '7days', '30days'].includes(type)) {
      return formatResponse(
        res,
        400,
        'Invalid type. Use 3days, 7days, or 30days',
        null
      );
    }

    const now = dayjs();
    let currentFrom, currentTo, previousFrom, previousTo;

    if (type === '3days') {
      currentFrom = now.subtract(2, 'day').startOf('day'); // 2 hari lalu
      currentTo = now.endOf('day'); // sampai hari ini
      previousFrom = currentFrom.subtract(3, 'day'); // 3 hari sebelumnya
      previousTo = currentFrom.subtract(1, 'second');
    } else if (type === '7days') {
      currentFrom = now.subtract(6, 'day').startOf('day');
      currentTo = now.endOf('day');
      previousFrom = currentFrom.subtract(7, 'day');
      previousTo = currentFrom.subtract(1, 'second');
    } else if (type === '30days') {
      currentFrom = now.subtract(29, 'day').startOf('day');
      currentTo = now.endOf('day');
      previousFrom = currentFrom.subtract(30, 'day');
      previousTo = currentFrom.subtract(1, 'second');
    }

    // Hitung total current & previous
    const [currentCount, previousCount] = await Promise.all([
      Income.countDocuments({
        createdAt: { $gte: currentFrom.toDate(), $lte: currentTo.toDate() }
      }),
      Income.countDocuments({
        createdAt: { $gte: previousFrom.toDate(), $lte: previousTo.toDate() }
      })
    ]);

    // --- Bangun detail per hari untuk periode current ---
    const tz = 'Asia/Jakarta'; // sesuaikan kalau perlu
    const rangeDays = type === '3days' ? 3 : type === '7days' ? 7 : 30;

    // Agregasi: group by tanggal lokal
    const detailAgg = await Income.aggregate([
      {
        $match: {
          createdAt: { $gte: currentFrom.toDate(), $lte: currentTo.toDate() }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: tz
            }
          },
          total: { $sum: 1 }
        }
      },
      { $project: { _id: 0, date: '$_id', total: 1 } }
    ]);

    // Map hasil agregasi -> tanggal → total
    const detailMap = new Map(detailAgg.map(d => [d.date, d.total]));

    // Isi array lengkap dari currentFrom sampai currentTo
    const detail = Array.from({ length: rangeDays }, (_, i) => {
      const d = currentFrom.add(i, 'day');
      return {
        date: d.toDate(), // bisa pakai d.format('YYYY-MM-DD') kalau mau string
        total: detailMap.get(d.format('YYYY-MM-DD')) ?? 0
      };
    });

    return formatResponse(res, 200, 'Income count summary retrieved', {
      type,
      current: {
        fromDate: currentFrom.toDate(),
        toDate: currentTo.toDate(),
        total: currentCount
      },
      previous: {
        fromDate: previousFrom.toDate(),
        toDate: previousTo.toDate(),
        total: previousCount
      },
      detail
    });
  } catch (err) {
    return formatResponse(res, 500, 'Failed to get income count summary', {
      error: err.message
    });
  }
};


const getOutcomeSummary = async (req, res) => {
  // return formatResponse(res, 200, 'Income summary retrieved', {
  //   "type": "today",
  //   "current": {
  //     "fromDate": "2025-08-22T17:00:00.000Z",
  //     "toDate": "2025-08-23T16:59:59.999Z",
  //     "total": 99999
  //   },
  //   "previous": {
  //     "fromDate": "2025-08-21T17:00:00.000Z",
  //     "toDate": "2025-08-22T16:59:59.999Z",
  //     "total": 999999
  //   }
  // });
  try {
    const { type } = req.params;

    if (!['today', '7days', '30days'].includes(type)) {
      return formatResponse(res, 400, 'Invalid type. Use today, 7days, or 30days', null);
    }

    const now = dayjs();
    let currentFrom, currentTo, previousFrom, previousTo;

    if (type === 'today') {
      currentFrom = now.startOf('day');
      currentTo = now.endOf('day');
      previousFrom = currentFrom.subtract(1, 'day');
      previousTo = currentTo.subtract(1, 'day');
    } else if (type === '7days') {
      currentFrom = now.subtract(6, 'day').startOf('day');
      currentTo = now.endOf('day');
      previousFrom = currentFrom.subtract(7, 'day');
      previousTo = currentFrom.subtract(1, 'second');
    } else if (type === '30days') {
      currentFrom = now.subtract(29, 'day').startOf('day');
      currentTo = now.endOf('day');
      previousFrom = currentFrom.subtract(30, 'day');
      previousTo = currentFrom.subtract(1, 'second');
    }

    const [currentAgg, previousAgg] = await Promise.all([
      Outcome.aggregate([
        {
          $match: {
            createdAt: { $gte: currentFrom.toDate(), $lte: currentTo.toDate() }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ]),
      Outcome.aggregate([
        {
          $match: {
            createdAt: { $gte: previousFrom.toDate(), $lte: previousTo.toDate() }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$totalPrice' }
          }
        }
      ])
    ]);

    return formatResponse(res, 200, 'Outcome summary retrieved', {
      type,
      current: {
        fromDate: currentFrom.toDate(),
        toDate: currentTo.toDate(),
        total: currentAgg[0]?.total || 0
      },
      previous: {
        fromDate: previousFrom.toDate(),
        toDate: previousTo.toDate(),
        total: previousAgg[0]?.total || 0
      }
    });
  } catch (err) {
    return formatResponse(res, 500, 'Failed to get outcome summary', { error: err.message });
  }
};

// const getOutcomeCountSummary = async (req, res) => {
//   try {
//     const { type } = req.params;

//     if (!['today', '7days', '30days'].includes(type)) {
//       return formatResponse(res, 400, 'Invalid type. Use today, 7days, or 30days', null);
//     }

//     const now = dayjs();
//     let currentFrom, currentTo, previousFrom, previousTo;

//     if (type === 'today') {
//       currentFrom = now.startOf('day');
//       currentTo = now.endOf('day');
//       previousFrom = currentFrom.subtract(1, 'day');
//       previousTo = currentTo.subtract(1, 'day');
//     } else if (type === '7days') {
//       currentFrom = now.subtract(6, 'day').startOf('day');
//       currentTo = now.endOf('day');
//       previousFrom = currentFrom.subtract(7, 'day');
//       previousTo = currentFrom.subtract(1, 'second');
//     } else if (type === '30days') {
//       currentFrom = now.subtract(29, 'day').startOf('day');
//       currentTo = now.endOf('day');
//       previousFrom = currentFrom.subtract(30, 'day');
//       previousTo = currentFrom.subtract(1, 'second');
//     }

//     const [currentCount, previousCount] = await Promise.all([
//       Outcome.countDocuments({
//         createdAt: { $gte: currentFrom.toDate(), $lte: currentTo.toDate() }
//       }),
//       Outcome.countDocuments({
//         createdAt: { $gte: previousFrom.toDate(), $lte: previousTo.toDate() }
//       })
//     ]);

//     return formatResponse(res, 200, 'Outcome count summary retrieved', {
//       type,
//       current: {
//         fromDate: currentFrom.toDate(),
//         toDate: currentTo.toDate(),
//         total: currentCount
//       },
//       previous: {
//         fromDate: previousFrom.toDate(),
//         toDate: previousTo.toDate(),
//         total: previousCount
//       }
//     });
//   } catch (err) {
//     return formatResponse(res, 500, 'Failed to get outcome count summary', { error: err.message });
//   }
// };

const getOutcomeCountSummary = async (req, res) => {
  // return formatResponse(res, 200, 'Outcome count summary retrieved', {
  //   type: '7days',
  //   current: {
  //     fromDate: new Date('2025-08-17T00:00:00.000Z'),
  //     toDate: new Date('2025-08-23T23:59:59.999Z'),
  //     total: 42
  //   },
  //   previous: {
  //     fromDate: new Date('2025-08-10T00:00:00.000Z'),
  //     toDate: new Date('2025-08-16T23:59:59.999Z'),
  //     total: 35
  //   },
  //   detail: [
  //     { date: new Date('2025-08-17T00:00:00.000Z'), total: 5 },
  //     { date: new Date('2025-08-18T00:00:00.000Z'), total: 3 },
  //     { date: new Date('2025-08-19T00:00:00.000Z'), total: 8 },
  //     { date: new Date('2025-08-20T00:00:00.000Z'), total: 6 },
  //     { date: new Date('2025-08-21T00:00:00.000Z'), total: 7 },
  //     { date: new Date('2025-08-22T00:00:00.000Z'), total: 4 },
  //     { date: new Date('2025-08-23T00:00:00.000Z'), total: 9 }
  //   ]
  // });

  try {
    const { type } = req.params;

    if (!['3days', '7days', '30days'].includes(type)) {
      return formatResponse(
        res,
        400,
        'Invalid type. Use 3days, 7days, or 30days',
        null
      );
    }

    const now = dayjs();
    let currentFrom, currentTo, previousFrom, previousTo;

    if (type === '3days') {
      currentFrom = now.subtract(2, 'day').startOf('day'); // 2 hari lalu
      currentTo = now.endOf('day'); // hari ini
      previousFrom = currentFrom.subtract(3, 'day');
      previousTo = currentFrom.subtract(1, 'second');
    } else if (type === '7days') {
      currentFrom = now.subtract(6, 'day').startOf('day');
      currentTo = now.endOf('day');
      previousFrom = currentFrom.subtract(7, 'day');
      previousTo = currentFrom.subtract(1, 'second');
    } else if (type === '30days') {
      currentFrom = now.subtract(29, 'day').startOf('day');
      currentTo = now.endOf('day');
      previousFrom = currentFrom.subtract(30, 'day');
      previousTo = currentFrom.subtract(1, 'second');
    }

    // Hitung total current & previous
    const [currentCount, previousCount] = await Promise.all([
      Outcome.countDocuments({
        createdAt: { $gte: currentFrom.toDate(), $lte: currentTo.toDate() }
      }),
      Outcome.countDocuments({
        createdAt: { $gte: previousFrom.toDate(), $lte: previousTo.toDate() }
      })
    ]);

    // --- Bangun detail per hari untuk periode current ---
    const tz = 'Asia/Jakarta'; // sesuaikan kalau perlu
    const rangeDays = type === '3days' ? 3 : type === '7days' ? 7 : 30;

    const detailAgg = await Outcome.aggregate([
      {
        $match: {
          createdAt: { $gte: currentFrom.toDate(), $lte: currentTo.toDate() }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt',
              timezone: tz
            }
          },
          total: { $sum: 1 }
        }
      },
      { $project: { _id: 0, date: '$_id', total: 1 } }
    ]);

    const detailMap = new Map(detailAgg.map(d => [d.date, d.total]));

    const detail = Array.from({ length: rangeDays }, (_, i) => {
      const d = currentFrom.add(i, 'day');
      return {
        date: d.toDate(), // kalau mau string: d.format('YYYY-MM-DD')
        total: detailMap.get(d.format('YYYY-MM-DD')) ?? 0
      };
    });

    return formatResponse(res, 200, 'Outcome count summary retrieved', {
      type,
      current: {
        fromDate: currentFrom.toDate(),
        toDate: currentTo.toDate(),
        total: currentCount
      },
      previous: {
        fromDate: previousFrom.toDate(),
        toDate: previousTo.toDate(),
        total: previousCount
      },
      detail
    });
  } catch (err) {
    return formatResponse(res, 500, 'Failed to get outcome count summary', {
      error: err.message
    });
  }
};

const getDailySummaryChart = async (req, res) => {
  // return formatResponse(res, 200, 'Daily summary chart retrieved', {
  //   "type": "income",        // atau "outcome" sesuai req.params.type
  //   "typeDate": 7,           // 7 / 14 / 30 sesuai req.query.typeDate
  //   "datas": [
  //     {
  //       "date": "2025-08-17T00:00:00.000Z",
  //       "total": req.params.type === 'income' ? 100000 : 0
  //     },
  //     {
  //       "date": "2025-08-18T00:00:00.000Z",
  //       "total": 150000
  //     },
  //     {
  //       "date": "2025-08-19T00:00:00.000Z",
  //       "total": 0
  //     },
  //     {
  //       "date": "2025-08-20T00:00:00.000Z",
  //       "total": 325000
  //     },
  //     {
  //       "date": "2025-08-21T00:00:00.000Z",
  //       "total": 0
  //     },
  //     {
  //       "date": "2025-08-22T00:00:00.000Z",
  //       "total": 0
  //     },
  //     {
  //       "date": "2025-08-23T00:00:00.000Z",
  //       "total": 91000
  //     }
  //   ]
  // });
  try {
    const { type } = req.params;
    const typeDate = parseInt(req.query.typeDate) || 7;

    if (!['income', 'outcome'].includes(type)) {
      return formatResponse(res, 400, 'Invalid type. Use income or outcome', null);
    }

    if (![7, 14, 30].includes(typeDate)) {
      return formatResponse(res, 400, 'Invalid typeDate. Use 7, 14, or 30', null);
    }

    const Model = type === 'income' ? Income : Outcome;
    const today = dayjs().endOf('day');
    const startDate = today.subtract(typeDate - 1, 'day').startOf('day');

    // Ambil data agregasi totalPrice per hari
    const result = await Model.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate.toDate(),
            $lte: today.toDate()
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          total: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Buat array lengkap 7/14/30 hari
    const datas = [];
    for (let i = 0; i < typeDate; i++) {
      const date = startDate.add(i, 'day');
      const dateStr = date.format('YYYY-MM-DD');
      const found = result.find(r => r._id === dateStr);
      datas.push({
        date: date.toDate(),
        total: found ? found.total : 0
      });
    }

    return formatResponse(res, 200, 'Daily summary retrieved', {
      type,
      typeDate,
      datas
    });

  } catch (err) {
    return formatResponse(res, 500, 'Failed to get daily summary', { error: err.message });
  }
};

const getTopItemsIncomeSummary = async (req, res) => {
  // return formatResponse(res, 200, 'Top items summary retrieved', {
  //   "type": "7days",
  //   "datas": [
  //     {
  //       "itemName": "Produk A",
  //       "total": 1200000,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     },
  //     {
  //       "itemName": "Produk B",
  //       "total": 850000,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     },
  //     {
  //       "itemName": "Produk C",
  //       "total": 500000,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     },
  //     {
  //       "itemName": "Produk D",
  //       "total": 300000,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     },
  //     {
  //       "itemName": "Produk E",
  //       "total": 100000,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     },
  //     {
  //       "itemName": "Produk F",
  //       "total": 0,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     }
  //   ]
  // })
  try {
    const { type } = req.params;

    if (!['today', '7days', '30days'].includes(type)) {
      return formatResponse(res, 400, 'Invalid type. Use today, 7days, or 30days', null);
    }

    const now = dayjs();
    let fromDate, toDate;

    if (type === 'today') {
      fromDate = now.startOf('day');
      toDate = now.endOf('day');
    } else if (type === '7days') {
      fromDate = now.subtract(6, 'day').startOf('day');
      toDate = now.endOf('day');
    } else {
      fromDate = now.subtract(29, 'day').startOf('day');
      toDate = now.endOf('day');
    }

    // Aggregasi berdasarkan item
    const aggregated = await Income.aggregate([
      {
        $match: {
          createdAt: {
            $gte: fromDate.toDate(),
            $lte: toDate.toDate()
          }
        }
      },
      {
        $group: {
          _id: '$item',
          total: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 6
      },
      {
        $lookup: {
          from: 'itemincomes',
          localField: '_id',
          foreignField: '_id',
          as: 'item'
        }
      },
      {
        $unwind: {
          path: '$item',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          itemName: '$item.name',
          total: 1
        }
      }
    ]);

    // Jika ada item yang tidak digunakan sama sekali selama periode ini
    const allItems = await ItemIncome.find().lean();
    const usedItemIds = aggregated.map(item => String(item._id));
    const unusedItems = allItems
      .filter(item => !usedItemIds.includes(String(item._id)))
      .slice(0, 6 - aggregated.length)
      .map(item => ({
        itemName: item.name,
        total: 0
      }));

    const datas = [
      ...aggregated.map(item => ({
        itemName: item.itemName || 'Unknown Item',
        total: item.total,
        fromDate: fromDate.toDate(),
        toDate: toDate.toDate()
      })),
      ...unusedItems.map(item => ({
        itemName: item.itemName,
        total: 0,
        fromDate: fromDate.toDate(),
        toDate: toDate.toDate()
      }))
    ];

    return formatResponse(res, 200, 'Top items summary retrieved', {
      type,
      datas
    });

  } catch (err) {
    return formatResponse(res, 500, 'Failed to get top items summary', { error: err.message });
  }
};

const getTopItemsOutcomeSummary = async (req, res) => {
  // return formatResponse(res, 200, 'Top items summary retrieved', {
  //   "type": "7days",
  //   "datas": [
  //     {
  //       "itemName": "Produk A2",
  //       "total": 1200000,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     },
  //     {
  //       "itemName": "Produk B",
  //       "total": 850000,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     },
  //     {
  //       "itemName": "Produk C",
  //       "total": 500000,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     },
  //     {
  //       "itemName": "Produk D",
  //       "total": 300000,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     },
  //     {
  //       "itemName": "Produk E",
  //       "total": 100000,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     },
  //     {
  //       "itemName": "Produk F",
  //       "total": 0,
  //       "fromDate": "2025-08-17T00:00:00.000Z",
  //       "toDate": "2025-08-23T23:59:59.999Z"
  //     }
  //   ]
  // })
  try {
    const { type } = req.params;

    if (!['today', '7days', '30days'].includes(type)) {
      return formatResponse(res, 400, 'Invalid type. Use today, 7days, or 30days', null);
    }

    const now = dayjs();
    let fromDate, toDate;

    if (type === 'today') {
      fromDate = now.startOf('day');
      toDate = now.endOf('day');
    } else if (type === '7days') {
      fromDate = now.subtract(6, 'day').startOf('day');
      toDate = now.endOf('day');
    } else {
      fromDate = now.subtract(29, 'day').startOf('day');
      toDate = now.endOf('day');
    }

    // Aggregasi berdasarkan item
    const aggregated = await Outcome.aggregate([
      {
        $match: {
          createdAt: {
            $gte: fromDate.toDate(),
            $lte: toDate.toDate()
          }
        }
      },
      {
        $group: {
          _id: '$item',
          total: { $sum: '$totalPrice' }
        }
      },
      {
        $sort: { total: -1 }
      },
      {
        $limit: 6
      },
      {
        $lookup: {
          from: 'itemoutcomes',
          localField: '_id',
          foreignField: '_id',
          as: 'item'
        }
      },
      {
        $unwind: {
          path: '$item',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          itemName: '$item.name',
          total: 1
        }
      }
    ]);

    // Cari item yang tidak muncul sama sekali
    const allItems = await ItemOutcome.find().lean();
    const usedItemIds = aggregated.map(item => String(item._id));
    const unusedItems = allItems
      .filter(item => !usedItemIds.includes(String(item._id)))
      .slice(0, 6 - aggregated.length)
      .map(item => ({
        itemName: item.name,
        total: 0
      }));

    const datas = [
      ...aggregated.map(item => ({
        itemName: item.itemName || 'Unknown Item',
        total: item.total,
        fromDate: fromDate.toDate(),
        toDate: toDate.toDate()
      })),
      ...unusedItems.map(item => ({
        itemName: item.itemName,
        total: 0,
        fromDate: fromDate.toDate(),
        toDate: toDate.toDate()
      }))
    ];

    return formatResponse(res, 200, 'Top outcome items summary retrieved', {
      type,
      datas
    });

  } catch (err) {
    return formatResponse(res, 500, 'Failed to get top outcome items summary', { error: err.message });
  }
};

const getLatestClientIncome = async (req, res) => {
  // return formatResponse(res, 200, 'Latest income clients retrieved', [
  //   {
  //     "customerName": "Andi asdasd asd asdasd ",
  //     "whatsapp": "08123456789",
  //     "qty": 2,
  //     "createdAt": "2025-08-23T10:15:30.000Z"
  //   },
  //   {
  //     "customerName": "Budi",
  //     "whatsapp": "08987654321",
  //     "qty": 1,
  //     "createdAt": "2025-08-23T09:40:10.000Z"
  //   },
  //   {
  //     "customerName": "Citra",
  //     "whatsapp": "08111122233",
  //     "qty": 3,
  //     "createdAt": "2025-08-22T16:22:45.000Z"
  //   },
  //   {
  //     "customerName": "Andi asdasd asd asdasd ",
  //     "whatsapp": "08123456789",
  //     "qty": 2,
  //     "createdAt": "2025-08-23T10:15:30.000Z"
  //   },
  //   {
  //     "customerName": "Budi",
  //     "whatsapp": "08987654321",
  //     "qty": 1,
  //     "createdAt": "2025-08-23T09:40:10.000Z"
  //   },
  //   {
  //     "customerName": "Citra",
  //     "whatsapp": "08111122233",
  //     "qty": 3,
  //     "createdAt": "2025-08-22T16:22:45.000Z"
  //   },
  //   {
  //     "customerName": "Andi asdasd asd asdasd ",
  //     "whatsapp": "08123456789",
  //     "qty": 2,
  //     "createdAt": "2025-08-23T10:15:30.000Z"
  //   },
  //   {
  //     "customerName": "Budi",
  //     "whatsapp": "08987654321",
  //     "qty": 1,
  //     "createdAt": "2025-08-23T09:40:10.000Z"
  //   },
  //   {
  //     "customerName": "Citra",
  //     "whatsapp": "08111122233",
  //     "qty": 3,
  //     "createdAt": "2025-08-22T16:22:45.000Z"
  //   },
  //   {
  //     "customerName": "Andi asdasd asd asdasd ",
  //     "whatsapp": "08123456789",
  //     "qty": 2,
  //     "createdAt": "2025-08-23T10:15:30.000Z"
  //   },
  //   {
  //     "customerName": "Budi",
  //     "whatsapp": "08987654321",
  //     "qty": 1,
  //     "createdAt": "2025-08-23T09:40:10.000Z"
  //   },
  //   {
  //     "customerName": "Citra",
  //     "whatsapp": "08111122233",
  //     "qty": 3,
  //     "createdAt": "2025-08-22T16:22:45.000Z"
  //   },
  //   {
  //     "customerName": "Andi asdasd asd asdasd ",
  //     "whatsapp": "08123456789",
  //     "qty": 2,
  //     "createdAt": "2025-08-23T10:15:30.000Z"
  //   },
  //   {
  //     "customerName": "Budi",
  //     "whatsapp": "08987654321",
  //     "qty": 1,
  //     "createdAt": "2025-08-23T09:40:10.000Z"
  //   },
  //   {
  //     "customerName": "Citra",
  //     "whatsapp": "08111122233",
  //     "qty": 3,
  //     "createdAt": "2025-08-22T16:22:45.000Z"
  //   },
  //   {
  //     "customerName": "Andi asdasd asd asdasd ",
  //     "whatsapp": "08123456789",
  //     "qty": 2,
  //     "createdAt": "2025-08-23T10:15:30.000Z"
  //   },
  //   {
  //     "customerName": "Budi",
  //     "whatsapp": "08987654321",
  //     "qty": 1,
  //     "createdAt": "2025-08-23T09:40:10.000Z"
  //   },
  //   {
  //     "customerName": "Citra",
  //     "whatsapp": "08111122233",
  //     "qty": 3,
  //     "createdAt": "2025-08-22T16:22:45.000Z"
  //   },
  //   {
  //     "customerName": "Andi asdasd asd asdasd ",
  //     "whatsapp": "08123456789",
  //     "qty": 2,
  //     "createdAt": "2025-08-23T10:15:30.000Z"
  //   },
  //   {
  //     "customerName": "Budi",
  //     "whatsapp": "08987654321",
  //     "qty": 1,
  //     "createdAt": "2025-08-23T09:40:10.000Z"
  //   },
  //   {
  //     "customerName": "Citra",
  //     "whatsapp": "08111122233",
  //     "qty": 3,
  //     "createdAt": "2025-08-22T16:22:45.000Z"
  //   },
  //   {
  //     "customerName": "Andi asdasd asd asdasd ",
  //     "whatsapp": "08123456789",
  //     "qty": 2,
  //     "createdAt": "2025-08-23T10:15:30.000Z"
  //   },
  //   {
  //     "customerName": "Budi",
  //     "whatsapp": "08987654321",
  //     "qty": 1,
  //     "createdAt": "2025-08-23T09:40:10.000Z"
  //   },
  //   {
  //     "customerName": "Citra",
  //     "whatsapp": "08111122233",
  //     "qty": 3,
  //     "createdAt": "2025-08-22T16:22:45.000Z"
  //   },
  // ]);
  try {
    const latestIncomes = await Income.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .select('customerName whatsapp quantity createdAt') // pilih field yang diperlukan

    const formatted = latestIncomes.map(income => ({
      customerName: income.customerName,
      whatsapp: income.whatsapp,
      qty: income.quantity,
      createdAt: income.createdAt
    }));

    return formatResponse(res, 200, 'Latest income clients retrieved', formatted);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to retrieve latest income clients', { error: err.message });
  }
};

module.exports = {
  getIncomeSummary,
  getIncomeCountSummary,
  getOutcomeSummary,
  getOutcomeCountSummary,
  getTopItemsOutcomeSummary,
  getTopItemsIncomeSummary,
  getLatestClientIncome,
  getDailySummaryChart
};
