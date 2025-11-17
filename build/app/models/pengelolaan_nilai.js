var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { DateTime } from 'luxon';
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm';
import { randomUUID } from 'crypto';
import DataTahunAjaran from './data_tahun_ajaran.js';
export default class PengelolaanNilai extends BaseModel {
    static async generateUuid(nilai) {
        nilai.id = randomUUID();
    }
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], PengelolaanNilai.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PengelolaanNilai.prototype, "kelasId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PengelolaanNilai.prototype, "mapelId", void 0);
__decorate([
    column(),
    __metadata("design:type", Object)
], PengelolaanNilai.prototype, "ujianId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PengelolaanNilai.prototype, "tahunAjaran", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PengelolaanNilai.prototype, "semester", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], PengelolaanNilai.prototype, "dataNilai", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], PengelolaanNilai.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], PengelolaanNilai.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => DataTahunAjaran, {
        foreignKey: 'tahun_ajaran',
    }),
    __metadata("design:type", Object)
], PengelolaanNilai.prototype, "dataSiswa", void 0);
__decorate([
    beforeCreate(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [PengelolaanNilai]),
    __metadata("design:returntype", Promise)
], PengelolaanNilai, "generateUuid", null);
//# sourceMappingURL=pengelolaan_nilai.js.map