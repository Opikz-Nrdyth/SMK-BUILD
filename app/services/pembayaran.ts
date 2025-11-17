import DataKelas from '#models/data_kelas'
import DataPembayaran from '#models/data_pembayaran'
import DataSiswa from '#models/data_siswa'
import DataTahunAjaran from '#models/data_tahun_ajaran'
import DataWebsite from '#models/data_website'
import { DateTime } from 'luxon'

export class AutomationPembayaranService {
  private readonly JENIS_PEMBAYARAN = {
    spp: 'SPP',
    up: 'Uang Pangkal',
    du: 'Uang Daftar Ulang',
  }

  public async Penetapan() {
    const dataWebsite = await DataWebsite.getAllSettings()
    const biayaAdmin = parseInt(dataWebsite.biaya_admin) ?? 0
    const spp10 = parseInt(dataWebsite.penetapan_spp_10) ?? 0
    const spp11 = parseInt(dataWebsite.penetapan_spp_11) ?? 0
    const spp12 = parseInt(dataWebsite.penetapan_spp_12) ?? 0
    const up = parseInt(dataWebsite.penetapan_up) ?? 0
    const du11 = parseInt(dataWebsite.penetapan_ud_11) ?? 0
    const du12 = parseInt(dataWebsite.penetapan_ud_12) ?? 0
    return {
      NOMINAL_SPP_10: String(spp10 + biayaAdmin),
      NOMINAL_SPP_11: String(spp11 + biayaAdmin),
      NOMINAL_SPP_12: String(spp12 + biayaAdmin),
      NOMINAL_UANG_PANGKAL: String(up + biayaAdmin),
      NOMINAL_DAFTAR_ULANG_11: String(du11 + biayaAdmin),
      NOMINAL_DAFTAR_ULANG_12: String(du12 + biayaAdmin),
    }
  }

  public async generateSpp() {
    try {
      const now = DateTime.now()
      const awalBulan = now.startOf('month').toISO()
      const akhirBulan = now.endOf('month').toISO()
      const tahunAjaran = await DataTahunAjaran.query().orderBy('created_at', 'desc').first()

      const p = await this.Penetapan()
      const dataKelas = await DataKelas.query().whereIn('jenjang', ['10', '11', '12'])

      let semuaNisn: string[] = []
      const mappingJenjang: Record<string, string> = {}

      // Mapping NISN → jenjang
      dataKelas.forEach((kelas) => {
        const list = JSON.parse(kelas.siswa)
        list.forEach((nisn: string) => {
          semuaNisn.push(nisn)
          mappingJenjang[nisn] = kelas.jenjang
        })
      })

      const nisnUnik = [...new Set(semuaNisn)]

      // Semua siswa valid
      const dataSiswa = await DataSiswa.query()
        .where('status', 'siswa')
        .whereIn('nisn', nisnUnik)
        .select('status', 'nisn', 'userId', 'jenisKelamin', 'noTelepon')
        .preload('user', (u) => u.select('id', 'fullName', 'email'))

      // Pembayaran bulan ini
      const dataPembayaranBulanIni = await DataPembayaran.query()
        .where('jenis_pembayaran', this.JENIS_PEMBAYARAN.spp)
        .whereBetween('created_at', [awalBulan, akhirBulan])

      const userIdSudahBayar = dataPembayaranBulanIni.map((p) => p.userId)

      // Siswa yang belum bayar
      const siswaBelumBayar = dataSiswa
        .filter((s) => !userIdSudahBayar.includes(s.user.id))
        .map((s) => ({
          ...s.toJSON(),
          user: s.user,
          jenjang: mappingJenjang[s.nisn],
        }))

      // Cek penetapan lengkap
      const nominalPerJenjang = {
        '10': p.NOMINAL_SPP_10,
        '11': p.NOMINAL_SPP_11,
        '12': p.NOMINAL_SPP_12,
      } as any

      // Validasi: semua jenjang harus punya penetapan
      for (const jenjang of ['10', '11', '12']) {
        if (!nominalPerJenjang[jenjang]) {
          return {
            message: `Nominal SPP untuk jenjang ${jenjang} belum diatur`,
          }
        }
      }

      // Bulk insert
      const inserts = siswaBelumBayar.map((s) => ({
        jenisPembayaran: this.JENIS_PEMBAYARAN.spp,
        nominalBayar: JSON.stringify([]),
        nominalPenetapan: nominalPerJenjang[s.jenjang],
        partisipasiUjian: false,
        userId: s.user.id,
        tahunAjaran: tahunAjaran?.kodeTa,
      }))

      await DataPembayaran.createMany(inserts)

      return {
        success: true,
        dibuatkan: inserts.length,
        detail: siswaBelumBayar,
      }
    } catch (error) {
      console.error('generateSpp error:', error)
    }
  }

  public async generateDU() {
    try {
      const p = await this.Penetapan()
      const dataKelas = await DataKelas.query().whereIn('jenjang', ['11', '12'])
      const tahunAjaran = await DataTahunAjaran.query().orderBy('created_at', 'desc').first()

      let semuaNisn: string[] = []
      const mappingJenjang: Record<string, string> = {}

      // Mapping NISN → jenjang (11 atau 12)
      dataKelas.forEach((kelas) => {
        const list = JSON.parse(kelas.siswa)

        list.forEach((nisn: string) => {
          semuaNisn.push(nisn)
          mappingJenjang[nisn] = kelas.jenjang
        })
      })

      const nisnUnik = [...new Set(semuaNisn)]

      // Ambil siswa valid
      const dataSiswa = await DataSiswa.query()
        .select('status', 'nisn', 'userId', 'jenisKelamin', 'noTelepon')
        .where('status', 'siswa')
        .whereIn('nisn', nisnUnik)
        .preload('user', (user) => user.select('id', 'fullName', 'email'))

      // Pembayaran DU tahun ini
      const pembayaranDU = await DataPembayaran.query()
        .where('jenis_pembayaran', this.JENIS_PEMBAYARAN.du)
        .andWhere('tahunAjaran', String(tahunAjaran?.kodeTa))

      const userIdSudahBayarDU = pembayaranDU.map((p) => p.userId)

      // Siswa yang belum bayar
      const siswaBelumBayar = dataSiswa
        .filter((s) => !userIdSudahBayarDU.includes(s.user.id))
        .map((s) => ({
          ...s.toJSON(),
          user: s.user,
          jenjang: mappingJenjang[s.nisn],
        }))

      // Validasi nominal DU
      const nominalPerJenjang = {
        '11': p.NOMINAL_DAFTAR_ULANG_11,
        '12': p.NOMINAL_DAFTAR_ULANG_12,
      } as any

      for (const jenjang of ['11', '12']) {
        if (!nominalPerJenjang[jenjang]) {
          return {
            message: `Nominal Daftar Ulang untuk jenjang ${jenjang} belum diatur`,
          }
        }
      }

      // Bulk insert DU
      const inserts = siswaBelumBayar.map((s) => ({
        jenisPembayaran: this.JENIS_PEMBAYARAN.du,
        nominalBayar: JSON.stringify([]),
        nominalPenetapan: nominalPerJenjang[s.jenjang],
        partisipasiUjian: false,
        userId: s.user.id,
        tahunAjaran: tahunAjaran?.kodeTa,
      }))

      await DataPembayaran.createMany(inserts)

      // Pisahkan untuk laporan
      const siswaKelas11 = siswaBelumBayar.filter((s) => s.jenjang === '11')
      const siswaKelas12 = siswaBelumBayar.filter((s) => s.jenjang === '12')

      return {
        success: true,
        dibuatkan: inserts.length,
        nominalPenetapan: {
          kelas11: p.NOMINAL_DAFTAR_ULANG_11,
          kelas12: p.NOMINAL_DAFTAR_ULANG_12,
        },
        data: {
          kelas_11: siswaKelas11,
          kelas_12: siswaKelas12,
        },
      }
    } catch (error) {
      console.log(error)
    }
  }

  public async generateUP() {
    try {
      const p = await this.Penetapan()
      const tahunAjaran = await DataTahunAjaran.query().orderBy('created_at', 'desc').first()
      const dataSiswa = await DataSiswa.query()
        .where('status', 'siswa')
        .select('status', 'nisn', 'userId', 'jenisKelamin', 'noTelepon')
        .preload('user', (user) => user.select('id', 'fullName', 'email'))

      const dataPembayaran = await DataPembayaran.query().where(
        'jenis_pembayaran',
        this.JENIS_PEMBAYARAN.up
      )

      const userIdSudahBayar = new Set(dataPembayaran.map((p) => p.userId))

      const siswaBelumBayar = dataSiswa.filter((siswa) => {
        return !userIdSudahBayar.has(siswa.user.id)
      })

      if (p.NOMINAL_UANG_PANGKAL && parseInt(p.NOMINAL_UANG_PANGKAL) >= 0) {
        for (const siswa of siswaBelumBayar) {
          await DataPembayaran.firstOrCreate(
            {
              userId: siswa.user.id,
              jenisPembayaran: this.JENIS_PEMBAYARAN.up,
            },
            {
              nominalBayar: JSON.stringify([]),
              nominalPenetapan: p.NOMINAL_UANG_PANGKAL,
              partisipasiUjian: false,
              tahunAjaran: tahunAjaran?.kodeTa,
            }
          )
        }
      } else {
        return {
          nominalPenetapan: p.NOMINAL_UANG_PANGKAL,
          jumlahSiswaBelumBayar: siswaBelumBayar.length,
          message: 'Uang Penetapan Uang Pangkal Belum Di Atur',
        }
      }

      return {
        nominalPenetapan: p.NOMINAL_UANG_PANGKAL,
        jumlahSiswaBelumBayar: siswaBelumBayar.length,
        data: siswaBelumBayar,
      }
    } catch (error) {
      console.log(error)
    }
  }
}
