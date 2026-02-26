/**
 * Generate time slots based on start time, end time, and duration
 */
const generateTimeSlots = (startTime, endTime, duration = 30, breaks = []) => {
    const slots = [];

    // Parse times (assuming format "HH:MM")
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    let current = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;

    while (current < end) {
        const slotStart = current;
        const slotEnd = current + duration;

        if (slotEnd <= end) {
            // Check if this slot overlaps with any break
            const isBreak = breaks.some(b => {
                const [bStartHour, bStartMin] = b.startTime.split(':').map(Number);
                const [bEndHour, bEndMin] = b.endTime.split(':').map(Number);
                const breakStart = bStartHour * 60 + bStartMin;
                const breakEnd = bEndHour * 60 + bEndMin;

                return (slotStart >= breakStart && slotStart < breakEnd) ||
                (slotEnd > breakStart && slotEnd <= breakEnd);
            });

            slots.push({
                startTime: formatTime(slotStart),
                endTime: formatTime(slotEnd),
                isBooked: false,
                status: isBreak ? 'break' : 'available'
            });
        }

        current += duration;
    }

    return slots;
};

/**
 * Format minutes to time string (HH:MM)
 */
const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Validate if a slot is available for booking
 */
const validateSlotAvailability = (slot, existingBookings = []) => {
    if (slot.isBooked) {
        return { available: false, reason: 'Slot already booked' };
    }

    if (slot.status === 'blocked' || slot.status === 'break') {
        return { available: false, reason: `Slot is ${slot.status}` };
    }

    // Check for existing bookings at same time
    const conflicting = existingBookings.some(b =>
        b.startTime === slot.startTime && b.isBooked
    );

    if (conflicting) {
        return { available: false, reason: 'Time slot conflict' };
    }

    return { available: true };
};

module.exports = {
    generateTimeSlots,
    formatTime,
    validateSlotAvailability
};