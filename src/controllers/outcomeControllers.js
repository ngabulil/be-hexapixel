const Outcome = require('../models/Outcome');
const { generateFileUrl } = require('../utils/filePath');
const { formatResponse, formatResponsePagination } = require('../utils/formatResponse');
const dayjs = require('dayjs');
const ExcelJS = require('exceljs');

const createOutcome = async (req, res) => {
    try {
        const { price, item, quantity, personInTransaction, whatsapp, totalPrice } = req.body;
        const receipt = req.file ? req.file.filename : '';

        if (!price || !item || !quantity || !personInTransaction || !whatsapp || !totalPrice || !receipt) {
            return formatResponse(res, 400, 'Missing required fields', null);
        }

        const outcome = await Outcome.create({
            price,
            item,
            quantity,
            personInTransaction,
            whatsapp,
            receipt: generateFileUrl("receipts", receipt, req),
            totalPrice,
            createdBy: req.user.id
        });

        return formatResponse(res, 201, 'Outcome created successfully', outcome);
    } catch (err) {
        return formatResponse(res, 500, 'Failed to create outcome', { error: err.message });
    }
};

const getOutcomes = async (req, res) => {
    try {
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const pipeline = [
            {
                $lookup: {
                    from: 'itemoutcomes',
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

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { personInTransaction: { $regex: search, $options: 'i' } },
                        { whatsapp: { $regex: search, $options: 'i' } },
                        { 'item.name': { $regex: search, $options: 'i' } },
                        { 'createdBy.fullName': { $regex: search, $options: 'i' } },
                        { 'createdBy.username': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        const totalCountPipeline = [...pipeline, { $count: 'total' }];
        const totalCountResult = await Outcome.aggregate(totalCountPipeline);
        const total = totalCountResult[0]?.total || 0;
        const totalPage = Math.ceil(total / limit);

        pipeline.push({ $sort: { createdAt: -1 } });
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: limit });

        const results = await Outcome.aggregate(pipeline);

        return formatResponsePagination(res, 200, 'Outcome list retrieved', results, page, limit, totalPage, req.query);
    } catch (err) {
        return formatResponsePagination(res, 500, 'Failed to get outcomes', { error: err.message }, 1, 10, 0, req.query);
    }
};

const getOutcomeById = async (req, res) => {
    try {
        const outcome = await Outcome.findById(req.params.id)
            .populate('item', 'name')
            .populate('createdBy', 'fullName username');

        if (!outcome) {
            return formatResponse(res, 404, 'Outcome not found', null);
        }

        return formatResponse(res, 200, 'Outcome found', outcome);
    } catch (err) {
        return formatResponse(res, 500, 'Failed to get outcome', { error: err.message });
    }
};

const updateOutcome = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (!['super_admin', 'manager'].includes(userRole)) {
            return formatResponse(res, 403, 'Unauthorized to update outcome', null);
        }

        const updatedData = { ...req.body };
        if (req.file) {
            updatedData.receipt = generateFileUrl("receipts", req.file.filename, req); // Menggunakan req.file.filename;
        }

        const updated = await Outcome.findByIdAndUpdate(
            req.params.id,
            updatedData,
            { new: true, runValidators: true }
        );

        if (!updated) {
            return formatResponse(res, 404, 'Outcome not found', null);
        }

        return formatResponse(res, 200, 'Outcome updated', updated);
    } catch (err) {
        return formatResponse(res, 500, 'Failed to update outcome', { error: err.message });
    }
};

const deleteOutcome = async (req, res) => {
    try {
        const userRole = req.user.role;
        if (!['super_admin', 'manager'].includes(userRole)) {
            return formatResponse(res, 403, 'Unauthorized to delete outcome', null);
        }

        const deleted = await Outcome.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return formatResponse(res, 404, 'Outcome not found', null);
        }

        return formatResponse(res, 200, 'Outcome deleted', deleted);
    } catch (err) {
        return formatResponse(res, 500, 'Failed to delete outcome', { error: err.message });
    }
};

const exportOutcomesByMonth = async (req, res) => {
    try {
        const { monthType } = req.params; // 'currMonth' atau 'prevMonth'

        const now = dayjs();
        const startOfMonth = monthType === 'prevMonth'
            ? now.subtract(1, 'month').startOf('month')
            : now.startOf('month');

        const endOfMonth = startOfMonth.endOf('month');

        const outcomes = await Outcome.find({
            createdAt: {
                $gte: startOfMonth.toDate(),
                $lte: endOfMonth.toDate()
            }
        })
            .populate('item', 'name')
            .populate('createdBy', 'fullName username');

        // Buat workbook dan worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`Outcomes ${monthType}`);

        // Header
        worksheet.columns = [
            { header: 'Tanggal', key: 'tanggal', width: 15 },
            { header: 'Item', key: 'item', width: 20 },
            { header: 'Jumlah', key: 'quantity', width: 10 },
            { header: 'Harga', key: 'price', width: 15 },
            { header: 'Total', key: 'totalPrice', width: 15 },
            { header: 'Nama', key: 'personInTransaction', width: 25 },
            { header: 'WhatsApp', key: 'whatsapp', width: 20 },
            { header: 'Created By', key: 'createdBy', width: 25 }
        ];

        // Rows
        outcomes.forEach(outcome => {
            worksheet.addRow({
                tanggal: dayjs(outcome.createdAt).format('YYYY-MM-DD'),
                item: outcome.item?.name || '-',
                quantity: outcome.quantity,
                price: outcome.price,
                totalPrice: outcome.totalPrice,
                personInTransaction: outcome.personInTransaction,
                whatsapp: outcome.whatsapp,
                createdBy: outcome.createdBy?.fullName || outcome.createdBy?.username || '-'
            });
        });

        // Send file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=outcomes-${monthType}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        return res.status(500).json({ message: 'Failed to export outcomes', error: err.message });
    }
};

module.exports = {
    createOutcome,
    getOutcomes,
    getOutcomeById,
    updateOutcome,
    deleteOutcome,
    exportOutcomesByMonth
};
