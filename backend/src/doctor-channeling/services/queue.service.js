class QueueService {
    constructor() {
        this.queue = new Map();//In memory queue, you can replace it with a database for persistence
    }

    /**
     * Adds a patient to the queue for a specific doctor.
     */
    async addToQueue(doctorId, slotTime, patientId) {
        const queueKey = `${doctorId}-${slotTime}`;

        if (!this.queue.has(queueKey)) {
            this.queue.set(queueKey, []);
        }
        const queue = this.queue.get(queueKey);
        const position = queue.length + 1;

        queue.push({
            patientId,
            joinedAt: new Date(),
            position
        });
        return{
            queueKey,
            position,
            totalInQueue: queue.length
        };
    }
    /**
     * get queue position for a patient
     */
    async getQueuePosition(doctorId, slotTime, patientId) {
        const queueKey = `${doctorId}-${slotTime}`;
        const queue = this.queue.get(queueKey) || [];

        const patitInQueue = queue.find(item=> item.patientId === patientId);
        return patientInQueue ? patientInQueue.position : 0;
    }
    /**
     * process next patient in queue when slot become available
     */
    async processNextInQueue(doctorId, slotTime) {
        const queueKey = `${doctorId}-${slotTime}`;
        const queue = this.queue.get(queueKey) || [];
        if(queue.length === 0){
            return null;//No patients in queue
        }
        const nextPatient = queue.shift();//Remove the first patient from the queue
        //Update positions of remaining patients
        queue.forEach((item, index) => {
            item.position = index + 1;
        });
        return nextPatient;
    }
    /**
     * remove patient from queue (e.g. if they cancel)
     */
    async removeFromQueue(doctorId, slotTime, patientId) {
        const queueKey = `${doctorId}-${slotTime}`;
        const queue = this.queue.get(queueKey) || [];

        const filteredQueue = queue.filter(item => item.patientId !== patientId);

        //Update positions
        filteredQueue.forEach((item, index) => {
            item.position = index + 1;
        });
        this.queue.set(queueKey, filteredQueue);
        return {
            removed: queue.length !== filteredQueue.length,
            newPosition: null
        };
    }
    /**
     * Get Queue status for a slot
     */
    async getQueueStatus(doctorId, slotTime) {
        const queueKey = `${doctorId}-${slotTime}`;
        const queue = this.queue.get(queueKey) || [];
        return {
            totalInQueue: queue.length,
            nextPatient: queue
        };
    }
}// pushed: ensure file content is saved to remote
