import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import DataPembayaran from './data_pembayaran.js'
import User from './user.js'

export default class RecordPembayaran extends BaseModel {
  @column({ isPrimary: true })
  declare id: string // Akan diisi oleh order_id Midtrans

  @column()
  declare pembayaranId: string // FK ke data_pembayarans

  @column()
  declare userId: string // FK ke users (dari custom_field1)

  @column()
  declare transactionStatus: string

  @column()
  declare grossAmount: string

  @column()
  declare fraudStatus: string

  @column()
  declare transactionTime: string

  @column()
  declare payment_method: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => DataPembayaran, {
    foreignKey: 'pembayaranId',
  })
  declare pembayaran: BelongsTo<typeof DataPembayaran>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>
}
