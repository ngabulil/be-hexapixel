const ItemIncome = require('../models/ItemIncome');
const { formatResponse } = require('../utils/formatResponse');

// CREATE
const createItemIncome = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await ItemIncome.findOne({ name });
    if (existing) {
      return formatResponse(res, 400, 'Item with this name already exists', null);
    }

    const item = await ItemIncome.create({ name });

    return formatResponse(res, 201, 'ItemIncome created successfully', item);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to create item', { error: err.message });
  }
};

// GET ALL (no pagination, frontend handles search)
const getAllItemIncomes = async (req, res) => {
  try {
    const items = await ItemIncome.find().sort({ createdAt: -1 });
    return formatResponse(res, 200, 'ItemIncome list retrieved', items.map(item => ({
      ...item,
      id: item._id
    })));
  } catch (err) {
    return formatResponse(res, 500, 'Failed to get item list', { error: err.message });
  }
};

// UPDATE
const updateItemIncome = async (req, res) => {
  try {
    const { name } = req.body;

    const updated = await ItemIncome.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return formatResponse(res, 404, 'ItemIncome not found', null);
    }

    return formatResponse(res, 200, 'ItemIncome updated successfully', updated);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to update item', { error: err.message });
  }
};

// DELETE
const deleteItemIncome = async (req, res) => {
  try {
    const deleted = await ItemIncome.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return formatResponse(res, 404, 'ItemIncome not found', null);
    }

    return formatResponse(res, 200, 'ItemIncome deleted successfully', deleted);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to delete item', { error: err.message });
  }
};

module.exports = {
  createItemIncome,
  getAllItemIncomes,
  updateItemIncome,
  deleteItemIncome
};
