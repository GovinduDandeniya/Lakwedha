const Joi = require('joi');

const validateAppointment = (data) => {
    const schema = Joi.object({
        doctorId: Joi.string().required(),
        slotId: Joi.string().required(),
        symptoms: Joi.string().max(500).optional()
    });

    return schema.validate(data);
};

const validateStatusUpdate = (data) => {
    const schema = Joi.object({
        status: Joi.string().valid(
            'confirmed', 'completed', 'cancelled', 'no-show'
        ).required(),
        reason: Joi.when('status', {
            is: 'cancelled',
            then: Joi.string().required(),
            otherwise: Joi.optional()
        })
    });

    return schema.validate(data);
};

module.exports = {
    validateAppointment,
    validateStatusUpdate
};