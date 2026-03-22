const Joi = require('joi');

const timeSlotSchema = Joi.object({
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    isBooked: Joi.boolean(),
    status: Joi.string().valid('available', 'booked', 'blocked', 'break')
});

const breakSchema = Joi.object({
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
    reason: Joi.string().max(100)
});

const validateAvailability = (data) => {
    const schema = Joi.object({
        date: Joi.date().required(),
        startTime: Joi.string().required(),
        endTime: Joi.string().required(),
        slotDuration: Joi.number().min(15).max(60).default(30),
        breaks: Joi.array().items(breakSchema),
        isRecurring: Joi.boolean(),
        recurrencePattern: Joi.when('isRecurring', {
            is: true,
            then: Joi.object({
                frequency: Joi.string().valid('daily', 'weekly', 'monthly').required(),
                endDate: Joi.date().min(Joi.ref('$date')).required()
            })
        })
    });

    return schema.validate(data);
};

module.exports = {
    validateAvailability
};