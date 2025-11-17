import BankSoal from '#models/bank_soal'
import DataGuru from '#models/data_guru'
import DataKelas from '#models/data_kelas'
import DataMapel from '#models/data_mapel'
import DataSiswa from '#models/data_siswa'
import DataTahunAjaran from '#models/data_tahun_ajaran'
import ManajemenKehadiran from '#models/manajemen_kehadiran'
import PengelolaanNilai from '#models/pengelolaan_nilai'
import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import { mkdir, readFile, writeFile } from 'fs/promises'
import { join } from 'path'
export default class PengelolaanNilaiController {
  public async index({ auth, inertia }: HttpContext) {
    auth.check()
    const user = auth.user!
    const dataGuru = await DataGuru.query().where('userId', user.id).first()

    const dataKelas = await DataKelas.query().whereRaw('JSON_CONTAINS(guru_pengampu, ?)', [
      JSON.stringify(dataGuru?.nip),
    ])

    return inertia.render('Nilai/PengelolaanNilai', { dataKelas, nip: dataGuru?.nip })
  }

  public async getMapelByKelas({ response, params }: HttpContext) {
    const { id } = params

    const dataMapel = await DataMapel.query().where('id', id)

    return response.json(dataMapel)
  }

  public async getUjian({ response, params }: HttpContext) {
    const { jenjang, mapelId } = params

    const dataUjian = await BankSoal.query().where('jenjang', jenjang).where('mapelId', mapelId)

    return response.json(dataUjian)
  }

  public async getNilai({ response, params }: HttpContext) {
    const { kelas, mapel, ujian } = params

    const dataNilaiSiswa = await PengelolaanNilai.query()
      .where('kelasId', kelas)
      .where('mapelId', mapel)
      .where('ujianId', ujian)
      .first()

    const dataMapel = await DataMapel.find(mapel)
    const dataKelas = await DataKelas.find(kelas)
    const dataUjian = await BankSoal.find(ujian)

    const daftarNisn =
      typeof dataKelas?.siswa == 'string' ? JSON.parse(dataKelas?.siswa) : dataKelas?.siswa
    const siswaList = await DataSiswa.query()
      .whereIn('nisn', daftarNisn)
      .preload('user')
      .select('nisn', 'userId')

    const nilaiList = await ManajemenKehadiran.query()
      .where('ujianId', ujian)
      .select('skor', 'userId')

    const hasil = siswaList.map((s) => {
      const nilai = nilaiList.find((n) => n.userId === s.userId)
      return {
        nisn: s.nisn,
        nama: s.user.fullName,
        nilai: nilai ? parseInt(nilai.skor) : 0,
        calculated: {
          naFormatif: 0,
          naSumatif: 0,
          naSumatifFinal: 0,
          nilaiRaport: 0,
          ranking: 0,
        },
        structure: {
          formatif: [],
          sumatif: [],
          nonTES: 0,
          tes: 0,
          deskripsi: '',
        },
      }
    })

    if (!dataNilaiSiswa) {
      const dataSemester = await DataTahunAjaran.query().orderBy('created_at', 'desc').first()

      const fileName = `${mapel}_${kelas}_${ujian}.json`
      const filePathJawaban = join(app.makePath('storage/nilai'), fileName)

      const fileContent = {
        metadata: {
          mapelName: dataMapel?.namaMataPelajaran,
          kelasName: dataKelas?.namaKelas,
          ujian: dataUjian?.namaUjian,
        },
        competence: [],
        data: hasil,
      }
      await mkdir(app.makePath('storage/nilai'), { recursive: true })

      await writeFile(filePathJawaban, JSON.stringify(fileContent))

      PengelolaanNilai.create({
        kelasId: kelas,
        mapelId: mapel,
        ujianId: ujian,
        semester: '',
        tahunAjaran: dataSemester?.tahunAjaran,
        dataNilai: filePathJawaban,
      })

      return response.json(fileContent)
    }
    const fileContent = await readFile(dataNilaiSiswa.dataNilai, 'utf-8')

    return response.json(fileContent)
  }

  public async save({ request, response, params }: HttpContext) {
    try {
      const { payload } = request.body()
      const { mapel, kelas, ujian } = params

      const fileName = `${kelas}_${mapel}_${ujian}.json`
      const filePathJawaban = join(app.makePath('storage/nilai'), fileName)
      await mkdir(app.makePath('storage/nilai'), { recursive: true })

      await writeFile(filePathJawaban, JSON.stringify(payload))

      return response.redirect().back()
    } catch (error) {
      console.error('Error saving data:', error)
      return response.status(500).json({
        success: false,
        error: 'Terjadi kesalahan saat menyimpan data',
      })
    }
  }
}
