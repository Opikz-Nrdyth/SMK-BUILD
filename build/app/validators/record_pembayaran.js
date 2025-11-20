import vine from '@vinejs/vine';
export const midtransNotificationValidator = vine.compile(vine.object({
    order_id: vine.string().trim(),
    transaction_status: vine.string().trim(),
    gross_amount: vine.string().trim(),
    fraud_status: vine.string().trim(),
    transaction_time: vine.string().trim(),
    custom_field1: vine.string().trim().optional(),
    custom_field2: vine.string().trim().optional(),
    signature_key: vine.string().trim().optional(),
    payment_type: vine.string().trim().optional(),
    status_code: vine.string().trim().optional(),
}));
//# sourceMappingURL=record_pembayaran.js.map