const ItemOutcome = require('../models/ItemOutcome');
const { formatResponse } = require('../utils/formatResponse');

// CREATE
const createItemOutcome = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await ItemOutcome.findOne({ name });
    if (existing) {
      return formatResponse(res, 400, 'Item with this name already exists', null);
    }

    const item = await ItemOutcome.create({ name });

    return formatResponse(res, 201, 'ItemOutcome created successfully', item);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to create item', { error: err.message });
  }
};

// GET ALL
const getAllItemOutcomes = async (req, res) => {
  try {
    const items = await ItemOutcome.find().sort({ createdAt: -1 });
    return formatResponse(res, 200, 'ItemOutcome list retrieved', items.map(item => ({
      ...item,
      id: item._id,
      value: item._id,
      label: item.name
    })));
  } catch (err) {
    return formatResponse(res, 500, 'Failed to get item list', { error: err.message });
  }
};

// UPDATE
const updateItemOutcome = async (req, res) => {
  try {
    const { name } = req.body;

    const updated = await ItemOutcome.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return formatResponse(res, 404, 'ItemOutcome not found', null);
    }

    return formatResponse(res, 200, 'ItemOutcome updated successfully', updated);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to update item', { error: err.message });
  }
};

// DELETE
const deleteItemOutcome = async (req, res) => {
  try {
    const deleted = await ItemOutcome.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return formatResponse(res, 404, 'ItemOutcome not found', null);
    }

    return formatResponse(res, 200, 'ItemOutcome deleted successfully', deleted);
  } catch (err) {
    return formatResponse(res, 500, 'Failed to delete item', { error: err.message });
  }
};

module.exports = {
  createItemOutcome,
  getAllItemOutcomes,
  updateItemOutcome,
  deleteItemOutcome
};
