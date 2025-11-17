// data_kelas.ts
import { DateTime } from 'luxon'
import { BaseModel, beforeCreate, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import { randomUUID } from 'crypto'
import DataGuru from './data_guru.js'

export default class DataKelas extends BaseModel {
  @column({ isPrimary: true })
  declare id: string

  @column()
  declare jenjang: string

  @column()
  declare namaKelas: string

  @column()
  declare waliKelas: string

  @column()
  declare guruPengampu: string

  @column()
  declare siswa: string

  // Tambahkan field baru untuk mapping guru-mapel
  @column({
    prepare: (value: Record<string, string[]>) => JSON.stringify(value),
    consume: (value: string | null) => {
      if (!value) return {}
      return typeof value === 'string' ? JSON.parse(value) : value
    },
  })
  declare guruMapelMapping: Record<string, string[]> // { [nip]: mapelId[] }

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime

  @belongsTo(() => DataGuru, {
    foreignKey: 'waliKelas',
    localKey: 'nip',
  })
  declare guru: BelongsTo<typeof DataGuru>

  @beforeCreate()
  public static async generateUuid(kelas: DataKelas) {
    kelas.id = randomUUID()
  }

  // Method existing untuk guruPengampu
  public getGuruAmpuArray(): string[] {
    try {
      return JSON.parse(this.guruPengampu || '[]')
    } catch {
      return []
    }
  }

  public setGuruAmpuArray(nips: string[]) {
    this.guruPengampu = JSON.stringify(nips)
  }

  public getSiswaArray(): string[] {
    try {
      return JSON.parse(this.siswa || '[]')
    } catch {
      return []
    }
  }

  public setSiswaArray(nisn: string[]) {
    this.siswa = JSON.stringify(nisn)
  }

  // Method baru untuk guruMapelMapping
  public getGuruMapelMapping(): Record<string, string[]> {
    return this.guruMapelMapping || {}
  }

  public setGuruMapelMapping(mapping: Record<string, string[]>) {
    this.guruMapelMapping = mapping
  }

  // Method: tambah mapping guru-mapel
  public addGuruMapel(nip: string, mapelId: string) {
    const mapping = this.getGuruMapelMapping()

    if (!mapping[nip]) {
      mapping[nip] = []
    }

    if (!mapping[nip].includes(mapelId)) {
      mapping[nip].push(mapelId)
    }

    this.setGuruMapelMapping(mapping)
  }

  // Method: hapus mapping guru-mapel
  public removeGuruMapel(nip: string, mapelId?: string) {
    const mapping = this.getGuruMapelMapping()

    if (mapelId && mapping[nip]) {
      mapping[nip] = mapping[nip].filter((id) => id !== mapelId)
      if (mapping[nip].length === 0) {
        delete mapping[nip]
      }
    } else {
      delete mapping[nip]
    }

    this.setGuruMapelMapping(mapping)
  }

  // Method: dapatkan mapel yang diampu guru di kelas ini
  public getMapelByGuru(nip: string): string[] {
    const mapping = this.getGuruMapelMapping()
    return mapping[nip] || []
  }

  // Method: dapatkan guru yang mengampu mapel tertentu di kelas ini
  public getGuruByMapel(mapelId: string): string[] {
    const mapping = this.getGuruMapelMapping()
    const result: string[] = []

    Object.entries(mapping).forEach(([nip, mapelIds]) => {
      if (mapelIds.includes(mapelId)) {
        result.push(nip)
      }
    })

    return result
  }
}
