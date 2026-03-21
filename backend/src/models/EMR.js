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
        },
        encryptedTreatment: {
            type: String,
        },
        encryptedNotes: {
            type: String,
        },
        title: String,
        type: String,
        fileUrl: String,
    },
    {
        timestamps: true,
        collection: 'emrs'
    }
);

emrSchema.index({ patientId: 1, doctorId: 1 });

module.exports = mongoose.model('EMR', emrSchema);
