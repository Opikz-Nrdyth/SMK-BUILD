import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'record_pembayarans';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.string('id');
            table.uuid('pembayaran_id').references('id').inTable('data_pembayarans').onDelete('CASCADE');
            table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
            table.string('transaction_status');
            table.string('gross_amount');
            table.string('fraud_status');
            table.string('transaction_time');
            table.string('payment_method');
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1763514286694_create_record_pembayarans_table.js.map