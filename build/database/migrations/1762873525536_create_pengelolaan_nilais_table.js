import { BaseSchema } from '@adonisjs/lucid/schema';
export default class extends BaseSchema {
    tableName = 'pengelolaan_nilais';
    async up() {
        this.schema.createTable(this.tableName, (table) => {
            table.string('id').primary();
            table.string('kelas_id');
            table.string('mapel_id');
            table.string('ujian_id');
            table
                .string('tahun_ajaran')
                .nullable()
                .references('id')
                .inTable('data_tahun_ajarans')
                .onDelete('SET NULL');
            table.string('semester');
            table.string('data_nilai');
            table.timestamp('created_at');
            table.timestamp('updated_at');
        });
    }
    async down() {
        this.schema.dropTable(this.tableName);
    }
}
//# sourceMappingURL=1762873525536_create_pengelolaan_nilais_table.js.map