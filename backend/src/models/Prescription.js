const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema(
    {
        // Doctor prescription fields
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        medications: [
            {
                name: { type: String },
                dosage: { type: String },
                duration: { type: String },
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
        // Pharmacy order prescription fields
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        pharmacyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        imageUrl: { type: String },
        patientName: { type: String, default: 'Anonymous Patient' },

        doctorStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },

        pharmacyStatus: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending',
        },

        medicines: [
            {
                name: String,
                quantity: Number,
                price: Number
            }
        ],

        subtotal: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        deliveryFee: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },

        pharmacyNote: { type: String },

        rejectionReason: {
            type: String,
            minlength: 10
        }
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
