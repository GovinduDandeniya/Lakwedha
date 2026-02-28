const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
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
        medications: [
            {
                name: { type: String, required: true },
                dosage: { type: String, required: true },
                duration: { type: String, required: true },
            }
        ],
        notes: {
            type: String,
            trim: true,
        },
        fileUrl: {
            type: String,
        },
        issuedDate: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: 'prescriptions'
    }
);

prescriptionSchema.index({ patientId: 1, doctorId: 1 });

prescriptionSchema.methods.isOwnedByDoctor = function (doctorId) {
    return this.doctorId.toString() === doctorId.toString();
};

module.exports = mongoose.model('Prescription', prescriptionSchema);
