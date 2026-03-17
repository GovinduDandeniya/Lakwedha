/**
 * Calculate estimated wait time based on queue position and average consultation time
 */
const estimateWaitTime = (queuePosition, averageConsultationTime = 30) => {
  return queuePosition * averageConsultationTime;
};

/**
 * Generate queue priority score (lower number = higher priority)
 */
const calculateQueuePriority = (patientData) => {
    let priority = 0;

    // Emergency cases get highest priority
    if (patientData.isEmergency) {
        priority -= 100;
    }

    // Elderly patients get priority
    if (patientData.age > 65) {
        priority -= 10;
    }

    // Children get priority
    if (patientData.age < 12) {
        priority -= 5;
    }

    // Waiting time increases priority
    if (patientData.waitingMinutes > 30) {
        priority -= Math.floor(patientData.waitingMinutes / 10);
    }

    return priority;
};

/**
 * Format queue position for display
 */
const formatQueuePosition = (position) => {
    if (position === 0) return 'Now serving';
    if (position === 1) return 'Next in line';
    return `Position: ${position}`;
};

module.exports = {
    estimateWaitTime,
    calculateQueuePriority,
    formatQueuePosition
};