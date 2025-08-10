const mongoose = require('mongoose');

const itemOutcomeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ItemOutcome', itemOutcomeSchema);
