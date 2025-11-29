import BankSoal from '#models/bank_soal'
import DataKelas from '#models/data_kelas'
import PengelolaanNilai from '#models/pengelolaan_nilai'
import User from '#models/user'
import fs from 'fs'
import type { HttpContext } from '@adonisjs/core/http'
import { join } from 'path'
import app from '@adonisjs/core/services/app'
import DataSiswa from '#models/data_siswa'

export default class RekapNilaisController {
  public async index({ inertia, auth }: HttpContext) {
    const userId = auth.user!

    const dataGuru = await User.query().where('id', userId.id).preload('dataGuru').first()

    if (!dataGuru?.dataGuru) {
      return inertia.render('Nilai/RekapNilai', {
        dataKelas: [],
      })
    }

    const dataKelas = await DataKelas.query().where('waliKelas', String(dataGuru.dataGuru.nip))

    return inertia.render('Nilai/RekapNilai', {
      dataKelas: dataKelas.map((k) => k.serialize()),
    })
  }

  public async getNilai({ params, response }: HttpContext) {
    const { kelasId, jenisUjian } = params

    try {
      // Dapatkan semua ujian dengan jenis tertentu
      const dataUjian = await BankSoal.query().where('jenisUjian', jenisUjian)

      if (dataUjian.length === 0) {
        return response.json([])
      }

      // Ekstrak ID ujian untuk filter
      const ujianIds = dataUjian.map((ujian) => ujian.id)

      // Dapatkan data nilai untuk semua ujian dengan jenis tersebut
      const dataPengelolaanNilai = await PengelolaanNilai.query()
        .where('kelasId', kelasId)
        .whereIn('ujianId', ujianIds)

      // Process each nilai record
      const result = await Promise.all(
        dataPengelolaanNilai.map(async (nilaiRecord) => {
          try {
            // Baca file JSON dari path yang disimpan
            const fileName = nilaiRecord.dataNilai
            const filePathNilai = join(app.makePath('storage/nilai'), fileName)
            const fileContent = fs.readFileSync(filePathNilai, 'utf-8')
            const jsonData = JSON.parse(fileContent)

            // Ekstrak data sesuai format yang diinginkan
            const extractedData = {
              namaMapel: jsonData.metadata?.mapelName || 'Unknown Mapel',
              dataNilai:
                jsonData.data?.map((siswa: any) => ({
                  nisn: siswa.nisn,
                  nama: siswa.nama,
                  nilaiRaport: siswa.calculated?.nilaiRaport || '0',
                })) || [],
            }

            return extractedData
          } catch (error) {
            console.error(`Error processing file ${nilaiRecord.dataNilai}:`, error)
            return {
              namaMapel: 'Error Loading Mapel',
              dataNilai: [],
            }
          }
        })
      )

      // Filter out empty results (jika ada error)
      const filteredResult = result.filter((item) => item.dataNilai.length > 0)

      return response.json(filteredResult)
    } catch (error) {
      return response.status(500).json({
        message: 'Terjadi kesalahan saat mengambil data nilai',
        error: error.message,
      })
    }
  }

  public async getKelas({ params, response }: HttpContext) {
    const { kelasId } = params

    try {
      // Ambil data kelas
      const dataKelas = await DataKelas.query().where('id', kelasId).first()

      if (!dataKelas) {
        return response.status(404).json({
          message: 'Kelas tidak ditemukan',
        })
      }

      // Parse data siswa dari JSON string (jika disimpan sebagai string)
      let nisnList: string[] = []

      if (typeof dataKelas.siswa === 'string') {
        // Jika disimpan sebagai JSON string, parse dulu
        nisnList = JSON.parse(dataKelas.siswa)
      } else if (Array.isArray(dataKelas.siswa)) {
        // Jika sudah berupa array, langsung gunakan
        nisnList = dataKelas.siswa
      } else {
        // Jika format tidak dikenali, return array kosong
        nisnList = []
      }

      // Jika tidak ada siswa, return array kosong
      if (nisnList.length === 0) {
        return response.json([])
      }

      // Ambil data siswa berdasarkan NISN
      const dataSiswaKelas = await DataSiswa.query()
        .whereIn('nisn', nisnList)
        .select(['nisn', 'userId'])
        .preload('user', (user) => user.select(['fullName']))

      const dataSiswaKelasConvert = dataSiswaKelas.map((item) => ({
        nisn: item.nisn,
        nama: item.user.fullName,
      }))

      return response.json(dataSiswaKelasConvert)
    } catch (error) {
      return response.status(500).json({
        message: 'Terjadi kesalahan saat mengambil data siswa',
        error: error.message,
      })
    }
  }
}
