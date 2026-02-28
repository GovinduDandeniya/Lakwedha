const mongoose = require('mongoose');

const emrSchema = new mongoose.Schema(
    {
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Patient',
            required: true,
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Doctor',
            required: true,
        },
        encryptedNotes: {
            type: String,
            required: true,
        },
        diagnosis: {
            type: String,
            required: true,
            trim: true,
        },
    },

    // Add name to schema
    {
        timestamps: true,
        collection: 'emrs'
    }
);

emrSchema.index({ patientId: 1, doctorId: 1 });


module.exports = mongoose.model('EMR', emrSchema);
