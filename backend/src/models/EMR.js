const mongoose = require('mongoose');

const emrSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        encryptedDiagnosis: {
            type: String,
            required: true,
        },
        encryptedTreatment: {
            type: String,
            required: true,
        },
        encryptedNotes: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
        collection: 'emrs'
    }
);

emrSchema.index({ patientId: 1, doctorId: 1 });

module.exports = mongoose.model('EMR', emrSchema);
