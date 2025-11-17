import { DateTime } from 'luxon'
import { BaseModel, column, beforeCreate, belongsTo } from '@adonisjs/lucid/orm'
import { randomUUID } from 'crypto'
import DataTahunAjaran from './data_tahun_ajaran.js'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

export default class PengelolaanNilai extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare kelasId: string

  @column()
  declare mapelId: string

  @column()
  declare ujianId: string | null

  @column()
  declare tahunAjaran: string

  @column()
  declare semester: string

  @column()
  declare dataNilai: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @beforeCreate()
  public static async generateUuid(nilai: PengelolaanNilai) {
    nilai.id = randomUUID()
  }

  @belongsTo(() => DataTahunAjaran, {
    foreignKey: 'tahun_ajaran',
  })
  declare dataSiswa: BelongsTo<typeof DataTahunAjaran>
}
