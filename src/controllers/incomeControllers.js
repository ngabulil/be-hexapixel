const Income = require('../models/Income');
const { formatResponse, formatResponsePagination } = require('../utils/formatResponse');
const dayjs = require('dayjs');
const ExcelJS = require('exceljs');

const createIncome = async (req, res) => {
  try {
    const { price, item, quantity, customerName, whatsapp, totalPrice } = req.body;

    if (!price || !item || !quantity || !customerName || !whatsapp || !totalPrice) {
      return formatResponse(res, 400, 'Missing required fields', null);
    }

    const income = await Income.create({
      price,
      item,
      quantity,
      customerName,
      whatsapp,
      totalPrice,
      createdBy: req.user.id
    });

    return formatResponse(res, 201, 'Income created successfully', income);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to create income', { error: err.message });
  }
};

const getIncomes = async (req, res) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    // const limit = 1;
    const skip = (page - 1) * limit;

    const pipeline = [
      {
        $lookup: {
          from: 'itemincomes',
          localField: 'item',
          foreignField: '_id',
          as: 'item'
        }
      },
      { $unwind: '$item' },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: 'createdBy'
        }
      },
      { $unwind: '$createdBy' }
    ];

    // Search filter
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { customerName: { $regex: search, $options: 'i' } },
            { whatsapp: { $regex: search, $options: 'i' } },
            { 'item.name': { $regex: search, $options: 'i' } },
            { 'createdBy.fullName': { $regex: search, $options: 'i' } },
            { 'createdBy.username': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    const totalCountPipeline = [...pipeline, { $count: 'total' }];
    const totalCountResult = await Income.aggregate(totalCountPipeline);
    const total = totalCountResult[0]?.total || 0;
    const totalPage = Math.ceil(total / limit);

    pipeline.push({ $sort: { createdAt: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    const results = await Income.aggregate(pipeline);

    return formatResponsePagination(res, 200, 'Income list retrieved', results, page, limit, totalPage, req.query);
  } catch (err) {
    return formatResponsePagination(res, 500, 'Failed to get incomes', { error: err.message }, 1, 10, 0, req.query);
  }
};

const getIncomeById = async (req, res) => {
  try {
    const income = await Income.findById(req.params.id)
      .populate('item', 'name')
      .populate('createdBy', 'fullName username');

    if (!income) {
      return formatResponse(res, 404, 'Income not found', null);
    }

    return formatResponse(res, 200, 'Income found', income);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to get income', { error: err.message });
  }
};


const updateIncome = async (req, res) => {
  try {
    const userRole = req.user.role;

    // Role yang bisa edit semua
    const elevatedRoles = ['super_admin', 'manager']; // tambahin 'owner' kalau ada
    const isElevated = elevatedRoles.includes(userRole);

    // Employee hanya boleh update dokumen miliknya
    const filter = {
      _id: req.params.id,
      ...(isElevated ? {} : { createdBy: req.user.id })
    };

    // Opsional: cegah perubahan field sensitif
    const payload = { ...req.body };
    delete payload._id;
    delete payload.createdBy; // jangan izinkan pindah kepemilikan via update

    const updated = await Income.findOneAndUpdate(
      filter,
      payload,
      { new: true, runValidators: true }
    );

    if (!updated) {
      // Bisa berarti: dokumen tidak ada, atau employee mencoba edit milik orang lain
      return formatResponse(res, 404, 'Income not found', null);
    }

    return formatResponse(res, 200, 'Income updated', updated);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to update income', { error: err.message });
  }
};

const deleteIncome = async (req, res) => {
  try {
    const userRole = req.user.role;

    if (!['super_admin', 'manager'].includes(userRole)) {
      return formatResponse(res, 403, 'Unauthorized to delete income', null);
    }

    const deleted = await Income.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return formatResponse(res, 404, 'Income not found', null);
    }

    return formatResponse(res, 200, 'Income deleted', deleted);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to delete income', { error: err.message });
  }
};

const exportIncomeExcel = async (req, res) => {
  try {
    const { type } = req.params; // 'currMonth' atau 'prevMonth'

    // Validasi jenis export
    if (!['currMonth', 'prevMonth'].includes(type)) {
      return res.status(400).json({ message: 'Invalid type. Use currMonth or prevMonth.' });
    }

    // Tentukan range tanggal
    const now = dayjs();
    const range = type === 'currMonth' ? now : now.subtract(1, 'month');

    const startDate = range.startOf('month').toDate();
    const endDate = range.endOf('month').toDate();

    // Ambil data income sesuai bulan
    const incomes = await Income.find({
      createdAt: { $gte: startDate, $lte: endDate }
    })
      .populate('item', 'name')
      .populate('createdBy', 'fullName');

    // Buat Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`Income_${type}`);

    // Header kolom
    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Item', key: 'item', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Price', key: 'price', width: 15 },
      { header: 'Total Price', key: 'totalPrice', width: 15 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Whatsapp', key: 'whatsapp', width: 18 },
      { header: 'Created By', key: 'createdBy', width: 20 },
      { header: 'Date', key: 'createdAt', width: 20 },
    ];

    // Data baris
    incomes.forEach((income, index) => {
      worksheet.addRow({
        no: index + 1,
        item: income.item?.name || '',
        quantity: income.quantity,
        price: income.price,
        totalPrice: income.totalPrice,
        customerName: income.customerName,
        whatsapp: income.whatsapp,
        createdBy: income.createdBy?.fullName || '',
        createdAt: dayjs(income.createdAt).format('YYYY-MM-DD HH:mm')
      });
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=income-${type}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export income data', error: err.message });
  }
};

module.exports = {
  createIncome,
  getIncomes,
  getIncomeById,
  updateIncome,
  deleteIncome,
  exportIncomeExcel
};
