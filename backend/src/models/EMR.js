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
        appointmentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Appointment',
            default: null,
        },
        encryptedDiagnosis: { type: String },
        encryptedTreatment: { type: String },
        encryptedNotes:     { type: String },
        title:        String,
        type:         { type: String, enum: ['camera', 'file', 'text', 'medical_record'], default: 'file' },
        fileUrl:      String,
        uploadedDate: String,
    },
    {
        timestamps: true,
        collection: 'emrs'
    }
);

emrSchema.index({ patientId: 1, doctorId: 1 });

module.exports = mongoose.model('EMR', emrSchema);
