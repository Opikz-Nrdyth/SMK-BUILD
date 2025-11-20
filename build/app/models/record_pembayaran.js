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
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm';
import DataPembayaran from './data_pembayaran.js';
import User from './user.js';
export default class RecordPembayaran extends BaseModel {
}
__decorate([
    column({ isPrimary: true }),
    __metadata("design:type", String)
], RecordPembayaran.prototype, "id", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], RecordPembayaran.prototype, "pembayaranId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], RecordPembayaran.prototype, "userId", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], RecordPembayaran.prototype, "transactionStatus", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], RecordPembayaran.prototype, "grossAmount", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], RecordPembayaran.prototype, "fraudStatus", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], RecordPembayaran.prototype, "transactionTime", void 0);
__decorate([
    column(),
    __metadata("design:type", String)
], RecordPembayaran.prototype, "payment_method", void 0);
__decorate([
    column.dateTime({ autoCreate: true }),
    __metadata("design:type", DateTime)
], RecordPembayaran.prototype, "createdAt", void 0);
__decorate([
    column.dateTime({ autoCreate: true, autoUpdate: true }),
    __metadata("design:type", DateTime)
], RecordPembayaran.prototype, "updatedAt", void 0);
__decorate([
    belongsTo(() => DataPembayaran, {
        foreignKey: 'pembayaranId',
    }),
    __metadata("design:type", Object)
], RecordPembayaran.prototype, "pembayaran", void 0);
__decorate([
    belongsTo(() => User, {
        foreignKey: 'userId',
    }),
    __metadata("design:type", Object)
], RecordPembayaran.prototype, "user", void 0);
//# sourceMappingURL=record_pembayaran.js.map