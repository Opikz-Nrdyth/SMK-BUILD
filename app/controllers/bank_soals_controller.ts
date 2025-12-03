import type { HttpContext } from '@adonisjs/core/http'
// app/controllers/bank_soals_controller.ts
import db from '@adonisjs/lucid/services/db'
import logger from '@adonisjs/core/services/logger'
import BankSoal from '#models/bank_soal'
import { bankSoalValidator } from '#validators/bank_soal'
import DataJurusan from '#models/data_jurusan'
import User from '#models/user'
import encryption from '@adonisjs/core/services/encryption'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'
import ExcelJS from 'exceljs'
import app from '@adonisjs/core/services/app'
import DataMapel from '#models/data_mapel'
import DataKelas from '#models/data_kelas'

export default class BankSoalsController {
  public async index({ request, inertia, session, auth }: HttpContext) {
    try {
      const page = request.input('page', 1)
      const search = request.input('search', '')
      await auth.check()
      const [totalBankSoal] = await Promise.all([BankSoal.query().count('* as total').first()])

      const query = BankSoal.query()

      if (search) {
        query.where((builder) => {
          builder
            .where('nama_ujian', 'LIKE', `%${search}%`)
            .orWhere('jenjang', 'LIKE', `%${search}%`)
            .orWhere('jenis_ujian', 'LIKE', `%${search}%`)
            .orWhere('kode', 'LIKE', `%${search}%`)
        })
      }

      const bankSoalPaginate = await query
        .orderBy('created_at', 'desc')
        .paginate(page, search ? Number(totalBankSoal?.$extras.total) || 1 : 15)

      // Get jurusan details for display
      const bankSoalsWithDetails = await Promise.all(
        bankSoalPaginate.all().map(async (soal) => {
          const jurusanDetails = await DataJurusan.query()
            .whereIn('id', soal.jurusan)
            .select('id', 'nama_jurusan')

          const penulisDetails = await User.query()
            .whereIn('id', soal.penulis)
            .select('id', 'full_name')

          const mapelDetails = await DataMapel.query()
            .where('id', soal.mapelId)
            .select('id', 'namaMataPelajaran')

          return {
            ...soal.toJSON(),
            mapelDetails: mapelDetails.map((m) => m.namaMataPelajaran),
            jurusanDetails: jurusanDetails.map((j) => j.namaJurusan),
            penulisDetails: penulisDetails.map((p) => p.fullName),
          }
        })
      )

      logger.info('Jumlah Bank Soal: ', Number(totalBankSoal?.$extras.total))
      return inertia.render('BankSoal/Index', {
        bankSoalPaginate: {
          currentPage: bankSoalPaginate.currentPage,
          lastPage: bankSoalPaginate.lastPage,
          total: bankSoalPaginate.total,
          perPage: bankSoalPaginate.perPage,
          firstPage: 1,
          nextPage:
            bankSoalPaginate.currentPage < bankSoalPaginate.lastPage
              ? bankSoalPaginate.currentPage + 1
              : null,
          previousPage: bankSoalPaginate.currentPage > 1 ? bankSoalPaginate.currentPage - 1 : null,
        },
        bankSoals: bankSoalsWithDetails,
        session: session.flashMessages.all(),
        searchQuery: search,
        auth: auth.user!,
      })
    } catch (error) {
      logger.error({ err: error }, 'Gagal memuat data bank soal')
      session.flash({
        status: 'error',
        message: 'Gagal memuat data bank soal',
        error: error,
      })
      return inertia.render('BankSoal/Index', {
        bankSoalPaginate: {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 15,
          firstPage: 1,
          nextPage: null,
          previousPage: null,
        },
        bankSoals: [],
        session: session.flashMessages.all(),
        searchQuery: '',
        auth: auth.user!,
      })
    }
  }

  public async indexGuru({ request, inertia, session, auth }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!

      const page = request.input('page', 1)
      const search = request.input('search', '')

      // Query hanya bank soal dimana user termasuk dalam penulis
      let query = BankSoal.query().whereRaw('JSON_CONTAINS(penulis, ?)', [`"${user.id}"`])

      if (search) {
        query.where((builder) => {
          builder
            .where('nama_ujian', 'LIKE', `%${search}%`)
            .orWhere('jenjang', 'LIKE', `%${search}%`)
            .orWhere('jenis_ujian', 'LIKE', `%${search}%`)
            .orWhere('kode', 'LIKE', `%${search}%`)
        })
      }

      const bankSoalPaginate = await query.orderBy('created_at', 'desc').paginate(page, 15)

      // Get jurusan details for display
      const bankSoalsWithDetails = await Promise.all(
        bankSoalPaginate.all().map(async (soal) => {
          const jurusanDetails = await DataJurusan.query()
            .whereIn('id', soal.jurusan)
            .select('id', 'nama_jurusan')

          const penulisDetails = await User.query()
            .whereIn('id', soal.penulis)
            .select('id', 'full_name')

          const mapelDetails = await DataMapel.query()
            .where('id', soal.mapelId)
            .select('id', 'namaMataPelajaran')

          return {
            ...soal.toJSON(),
            mapelDetails: mapelDetails.map((m) => m.namaMataPelajaran),
            jurusanDetails: jurusanDetails.map((j) => j.namaJurusan),
            penulisDetails: penulisDetails.map((p) => p.fullName),
          }
        })
      )

      return inertia.render('BankSoal/Index', {
        bankSoalPaginate: {
          currentPage: bankSoalPaginate.currentPage,
          lastPage: bankSoalPaginate.lastPage,
          total: bankSoalPaginate.total,
          perPage: bankSoalPaginate.perPage,
          firstPage: 1,
          nextPage:
            bankSoalPaginate.currentPage < bankSoalPaginate.lastPage
              ? bankSoalPaginate.currentPage + 1
              : null,
          previousPage: bankSoalPaginate.currentPage > 1 ? bankSoalPaginate.currentPage - 1 : null,
        },
        bankSoals: bankSoalsWithDetails,
        session: session.flashMessages.all(),
        searchQuery: search,
        auth: auth.user!,
      })
    } catch (error) {
      logger.error({ err: error }, 'Gagal memuat data bank soal guru')
      session.flash({
        status: 'error',
        message: 'Gagal memuat data bank soal',
        error: error,
      })
      return inertia.render('BankSoal/Index', {
        bankSoalPaginate: {
          currentPage: 1,
          lastPage: 1,
          total: 0,
          perPage: 15,
          firstPage: 1,
          nextPage: null,
          previousPage: null,
        },
        bankSoals: [],
        session: session.flashMessages.all(),
        searchQuery: '',
        auth: auth.user!,
      })
    }
  }

  public async create({ inertia, session }: HttpContext) {
    try {
      const [jurusanList, usersList, mapelList] = await Promise.all([
        DataJurusan.query(),
        User.query().select('id', 'full_name').where('role', 'Guru'),
        DataMapel.query(),
      ])

      return inertia.render('BankSoal/Create', {
        jurusanList,
        usersList,
        mapelList,
        session: session.flashMessages.all(),
      })
    } catch (error) {
      logger.error({ err: error }, 'Gagal memuat halaman create bank soal')
      session.flash({
        status: 'error',
        message: 'Gagal memuat halaman buat bank soal',
        error: error,
      })
      return inertia.render('BankSoal/Create', {
        jurusanList: [],
        usersList: [],
        mapelList: [],
        session: session.flashMessages.all(),
      })
    }
  }

  public async edit({ inertia, params, session }: HttpContext) {
    const bankSoal = await BankSoal.findOrFail(params.id)

    const [jurusanList, usersList, mapelList] = await Promise.all([
      DataJurusan.query().select('id', 'nama_jurusan'),
      User.query().select('id', 'full_name'),
      DataMapel.query(),
    ])

    return inertia.render('BankSoal/Edit', {
      bankSoal,
      jurusanList,
      usersList,
      mapelList,
      session: session.flashMessages.all(),
    })
  }

  public async createGuru({ inertia, auth, session }: HttpContext) {
    try {
      await auth.check()
      const user = auth.user!
      await user.load('dataGuru')

      const nip = user.dataGuru.nip

      // Ambil data kelas yang diampu oleh guru
      const dataKelas = await DataKelas.query().whereRaw('JSON_CONTAINS(guru_pengampu, ?)', [
        `"${nip}"`,
      ])

      // Ambil ID kelas yang diampu
      const kelasIds = dataKelas.map((kelas) => kelas.id)

      // Get jurusan dari kelas yang diampu
      const jurusanList = await DataJurusan.query()
        .whereRaw('JSON_OVERLAPS(kelas_id, ?)', [JSON.stringify(kelasIds)])
        .orderBy('nama_jurusan', 'asc')

      const mapelList = await DataMapel.query()

      return inertia.render('BankSoal/Create', {
        jurusanList,
        mapelList,
        usersList: [user],
        session: session.flashMessages.all(),
      })
    } catch (error) {
      logger.error({ err: error }, 'Gagal memuat halaman create bank soal guru')
      session.flash({
        status: 'error',
        message: 'Gagal memuat halaman buat bank soal',
        error: error,
      })
      return inertia.render('BankSoal/Create', {
        jurusanList: [],
        mapelList: [],
        usersList: [],
        session: session.flashMessages.all(),
      })
    }
  }

  public async editGuru({ inertia, params, auth, session }: HttpContext) {
    await auth.check()
    const user = auth.user!
    await user.load('dataGuru')

    const nip = user.dataGuru.nip

    const bankSoal = await BankSoal.query()
      .where('id', params.id)
      .whereRaw('JSON_CONTAINS(penulis, ?)', [`"${user.id}"`])
      .firstOrFail()

    // Ambil data kelas yang diampu oleh guru
    const dataKelas = await DataKelas.query().whereRaw('JSON_CONTAINS(guru_pengampu, ?)', [
      `"${nip}"`,
    ])

    // Ambil ID kelas yang diampu
    const kelasIds = dataKelas.map((kelas) => kelas.id)

    // Get jurusan dari kelas yang diampu
    const jurusanList = await DataJurusan.query()
      .whereRaw('JSON_OVERLAPS(kelas_id, ?)', [JSON.stringify(kelasIds)])

      .orderBy('nama_jurusan', 'asc')

    const mapelList = await DataMapel.query()

    return inertia.render('BankSoal/Edit', {
      bankSoal,
      jurusanList,
      mapelList,
      usersList: [user],
      session: session.flashMessages.all(),
    })
  }

  public async store({ request, response, session }: HttpContext) {
    const trx = await db.transaction()

    try {
      const payload = await request.validateUsing(bankSoalValidator)

      // Create encrypted file
      const fileName = `${payload.namaUjian || 'soal'}-${Date.now()}.opz`
      const filePath = join(app.makePath('storage/soal_files'), fileName)

      // Ensure directory exists
      await mkdir(app.makePath('storage/soal_files'), { recursive: true })

      // Encrypt and save file
      const encryptedContent = encryption.encrypt(payload.soalFile)
      await writeFile(filePath, encryptedContent)

      await BankSoal.create(
        {
          namaUjian: payload.namaUjian,
          jenjang: payload.jenjang,
          jurusan: payload.jurusan,
          jenisUjian: payload.jenisUjian as any,
          penulis: payload.penulis,
          kode: payload.kode,
          mapelId: payload.mapel,
          waktu: payload.waktu,
          tanggalUjian: payload.tanggalUjian,
          soalFile: fileName,
        },
        { client: trx }
      )

      await trx.commit()

      session.flash({
        status: 'success',
        message: 'Bank soal berhasil ditambahkan.',
      })
      return response.redirect().withQs().back()
    } catch (error) {
      await trx.rollback()
      logger.error({ err: error }, 'Gagal menyimpan bank soal baru')
      session.flash({
        status: 'error',
        message: 'Gagal menyimpan bank soal',
        error: error,
      })
      return response.redirect().withQs().back()
    }
  }

  public async update({ request, response, session, params }: HttpContext) {
    const trx = await db.transaction()

    try {
      const payload = await request.validateUsing(bankSoalValidator)
      const bankSoal = await BankSoal.findOrFail(params.id)

      bankSoal.merge({
        namaUjian: payload.namaUjian,
        jenjang: payload.jenjang,
        jurusan: payload.jurusan,
        kode: payload.kode,
        jenisUjian: payload.jenisUjian as any,
        mapelId: payload.mapel,
        penulis: payload.penulis,
        waktu: payload.waktu,
        tanggalUjian: payload.tanggalUjian,
      })

      await bankSoal.save()

      await trx.commit()

      session.flash({
        status: 'success',
        message: 'Bank soal berhasil diperbarui.',
      })
      return response.redirect().withQs().back()
    } catch (error) {
      await trx.rollback()
      logger.error({ err: error }, `Gagal update bank soal`)
      session.flash({
        status: 'error',
        message: 'Gagal memperbarui bank soal',
        error: error,
      })
      return response.redirect().withQs().back()
    }
  }

  public async destroy({ response, session, params }: HttpContext) {
    try {
      const { id } = params
      const bankSoal = await BankSoal.findOrFail(id)
      await bankSoal.delete()

      session.flash({
        status: 'success',
        message: 'Bank soal berhasil dihapus.',
      })
    } catch (error) {
      logger.error({ err: error }, `Gagal hapus bank soal`)
      session.flash({
        status: 'error',
        message: 'Gagal menghapus bank soal',
        error: error,
      })
    }
    return response.redirect().withQs().back()
  }

  public async getFileContent({ request, response }: HttpContext) {
    try {
      const { id } = request.params()
      const bankSoal = await BankSoal.findOrFail(id)

      if (!bankSoal.soalFile) {
        return response.status(404).json({
          success: false,
          message: 'File soal tidak ditemukan',
        })
      }

      // Read encrypted file dari storage
      const filePath = join(app.makePath('storage/soal_files'), bankSoal.soalFile)
      const fileContent = await readFile(filePath, 'utf-8')

      // Decrypt content
      const decryptedContent = encryption.decrypt(fileContent)

      return response.json({
        success: true,
        data: {
          id: bankSoal.id,
          namaUjian: bankSoal.namaUjian,
          kode: bankSoal.kode,
          content:
            typeof decryptedContent === 'string' ? JSON.parse(decryptedContent) : decryptedContent,
        },
      })
    } catch (error) {
      logger.error({ err: error }, `Gagal membaca file soal ${request.params().id}`)
      return response.status(500).json({
        success: false,
        message: 'Gagal membaca file soal',
      })
    }
  }

  public async updateSoal({ request, response, session, params }: HttpContext) {
    try {
      const { soalContent } = request.only(['soalContent'])
      const bankSoal = await BankSoal.findOrFail(params.id)

      // Validasi soal content
      if (!Array.isArray(soalContent)) {
        throw new Error('Format konten soal tidak valid')
      }

      for (const [index, soal] of soalContent.entries()) {
        if (
          !soal.id ||
          !soal.soal ||
          !soal.A ||
          !soal.B ||
          !soal.C ||
          !soal.D ||
          !soal.E ||
          !soal.kunci
        ) {
          throw new Error(`Soal nomor ${index + 1} tidak lengkap`)
        }

        if (!['A', 'B', 'C', 'D', 'E'].includes(soal.kunci)) {
          throw new Error(`Kunci jawaban soal nomor ${index + 1} tidak valid`)
        }
      }

      const newSoalContent = soalContent.map((item) => {
        if (bankSoal.jenisUjian === 'Ujian Mandiri') {
          return { ...item, selected: true }
        }
        if (bankSoal.jenisUjian === 'PAS' || bankSoal.jenisUjian === 'PAT') {
          return { ...item, selected: !!item.selected }
        }
        return { ...item, selected: false }
      })

      // Buat direktori jika belum ada
      const storagePath = app.makePath('storage/soal_files')
      await mkdir(storagePath, { recursive: true })

      // Generate nama file
      let fileName = bankSoal.soalFile
      if (!fileName) {
        fileName = `${bankSoal.namaUjian}-${Date.now()}.opz`
      }
      const filePath = join(storagePath, fileName)

      // Encrypt dan simpan ke file
      const encryptedContent = encryption.encrypt(JSON.stringify(newSoalContent, null, 2))
      await writeFile(filePath, encryptedContent)

      // Update path file di database
      bankSoal.soalFile = fileName
      await bankSoal.save()

      // Untuk request dari offline sync, return JSON
      if (request.accepts(['html', 'json']) === 'json') {
        return response.json({
          success: true,
          message: 'Soal berhasil disinkronisasi',
        })
      }

      session.flash({
        status: 'success',
        message: 'Konten soal berhasil diperbarui.',
      })
      return response.redirect().withQs().back()
    } catch (error) {
      logger.error({ err: error }, `Gagal update konten soal ${params.id}`)

      if (request.accepts(['html', 'json']) === 'json') {
        return response.status(500).json({
          success: false,
          error: error.message,
        })
      }

      session.flash({
        status: 'error',
        message: 'Gagal memperbarui konten soal',
        error: error,
      })
      return response.redirect().withQs().back()
    }
  }

  public async editSoal({ inertia, params, response, session }: HttpContext) {
    try {
      const bankSoal = await BankSoal.findOrFail(params.id)

      let soalContent = []

      // Jika ada file soal, baca dari file
      if (bankSoal.soalFile) {
        try {
          const filePath = join(app.makePath('storage/soal_files'), bankSoal.soalFile)
          const fileContent = await readFile(filePath, 'utf-8')
          const decryptedContent = encryption.decrypt(fileContent)
          soalContent =
            typeof decryptedContent === 'string' ? JSON.parse(decryptedContent) : decryptedContent
        } catch (error) {
          logger.warn(`Invalid file content for bank soal ${params.id}, initializing empty array`)
          soalContent = []
        }
      }

      return inertia.render('BankSoal/EditSoal', {
        bankSoal: bankSoal.serialize(),
        soalContent,
        session: session.flashMessages.all(),
      })
    } catch (error) {
      logger.error(error, `Error editing soal content for bank soal ${params.id}`)
      session.flash({
        status: 'error',
        message: 'Gagal memuat konten soal',
        error: error,
      })
      return response.redirect().withQs().back()
    }
  }

  public async selectedSoal({ inertia, params, response, session }: HttpContext) {
    try {
      const bankSoal = await BankSoal.findOrFail(params.id)

      let soalContent = []

      // Jika ada file soal, baca dari file
      if (bankSoal.soalFile) {
        try {
          const filePath = join(app.makePath('storage/soal_files'), bankSoal.soalFile)
          const fileContent = await readFile(filePath, 'utf-8')
          const decryptedContent = encryption.decrypt(fileContent)
          soalContent =
            typeof decryptedContent === 'string' ? JSON.parse(decryptedContent) : decryptedContent
        } catch (error) {
          logger.warn(`Invalid file content for bank soal ${params.id}, initializing empty array`)
          soalContent = []
        }
      }

      return inertia.render('BankSoal/SelectedUjian', {
        bankSoal: bankSoal.serialize(),
        soalContent,
        session: session.flashMessages.all(),
      })
    } catch (error) {
      logger.error(error, `Error editing soal content for bank soal ${params.id}`)
      session.flash({
        status: 'error',
        message: 'Gagal memuat konten soal',
        error: error,
      })
      return response.redirect().withQs().back()
    }
  }

  public async importFromExcel({ request, response, session, auth }: HttpContext) {
    const trx = await db.transaction()

    try {
      await auth.check()
      const user = auth.user!

      // Validasi file upload
      const excelFile = request.file('excel_file', {
        size: '10mb',
        extnames: ['xlsx', 'xls'],
      })

      if (!excelFile) {
        throw new Error('File Excel tidak ditemukan')
      }

      if (!excelFile.isValid) {
        throw new Error(excelFile.errors[0]?.message || 'File Excel tidak valid')
      }

      // Simpan file sementara

      await excelFile.move(tmpdir(), {
        name: `import_soal_${Date.now()}_${excelFile.clientName}`,
        overwrite: true,
      })

      if (!excelFile.filePath) {
        throw new Error('Gagal menyimpan file sementara')
      }

      // Baca file Excel
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(excelFile.filePath)

      const worksheet = workbook.worksheets[0]

      if (!worksheet) {
        throw new Error('Worksheet tidak ditemukan')
      }

      const soalData = []
      let currentSoal = null
      let soalCounter = 1
      let mulaiMembaca = false

      // Cari mulai baris yang berisi data soal (bisa mulai dari row mana saja)
      for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber)

        // Cari baris yang berisi "No" di kolom pertama (indikator header tabel)
        const cellA = row.getCell(1).value?.toString()?.trim() as any
        const cellB = row.getCell(2).value?.toString()?.trim() as any
        const cellC = row.getCell(3).value?.toString()?.trim() as any

        // Jika ditemukan header "No", "Jenis", "Kode" maka mulai membaca
        if (cellA === 'No' && cellB === 'Jenis' && cellC === 'Kode') {
          mulaiMembaca = true
          continue
        }

        if (!mulaiMembaca) {
          continue
        }

        // Skip baris kosong
        if (!cellA && !cellB && !cellC) {
          continue
        }

        const jenis = cellB?.toUpperCase() || ''
        const kode = cellC?.toUpperCase() || ''
        const isi = row.getCell(4).value?.toString()?.trim() || ''
        const statusJawaban = parseInt(row.getCell(5).value?.toString() || '0')
        const tingkatKesulitan = parseInt(row.getCell(6).value?.toString() || '5')

        // Validasi data minimal
        if (!jenis || !kode) {
          continue
        }

        // Jika baris baru dengan nomor soal (jenis = SOAL)
        if (jenis === 'SOAL' && kode === 'Q') {
          // Simpan soal sebelumnya jika ada
          if (currentSoal) {
            soalData.push(currentSoal)
          }

          // Buat objek soal baru
          currentSoal = {
            id: soalCounter++,
            soal: this.formatToHTML(isi),
            jawaban: {
              A: { text: '-', isCorrect: false },
              B: { text: '-', isCorrect: false },
              C: { text: '-', isCorrect: false },
              D: { text: '-', isCorrect: false },
              E: { text: '-', isCorrect: false },
            },
            kunci: null,
            tingkatKesulitan: tingkatKesulitan,
          } as any
        }

        // Jika baris jawaban (jenis = JAWABAN)
        else if (jenis === 'JAWABAN' && kode === 'A' && currentSoal) {
          // Tentukan pilihan jawaban (A-E) berdasarkan urutan
          const jawabanOptions = ['A', 'B', 'C', 'D', 'E']
          let pilihan = ''

          // Cari pilihan yang masih kosong
          for (const option of jawabanOptions) {
            if (currentSoal.jawaban[option].text === '-') {
              pilihan = option
              break
            }
          }

          // Jika semua sudah terisi (mungkin ada lebih dari 5), skip
          if (!pilihan) {
            continue
          }

          // Format isi jawaban ke HTML
          const jawabanHTML = this.formatToHTML(isi)

          // Update jawaban
          currentSoal.jawaban[pilihan] = {
            text: jawabanHTML,
            isCorrect: statusJawaban === 1,
          }

          // Jika ini jawaban yang benar, set kunci
          if (statusJawaban === 1) {
            currentSoal.kunci = pilihan as any
          }
        }
      }

      // Tambahkan soal terakhir
      if (currentSoal) {
        soalData.push(currentSoal)
      }

      // Validasi data soal
      if (soalData.length === 0) {
        throw new Error('Tidak ada data soal yang ditemukan dalam file Excel')
      }

      // Validasi setiap soal
      for (const [index, soal] of soalData.entries()) {
        if (!soal.soal || soal.soal.trim() === '') {
          throw new Error(`Soal nomor ${index + 1} tidak memiliki pertanyaan`)
        }

        // Cek apakah ada jawaban yang valid (tidak semua "-")
        const jawabanValid = Object.values(soal.jawaban).some((j: any) => j.text !== '-')
        if (!jawabanValid) {
          throw new Error(`Soal nomor ${index + 1} tidak memiliki jawaban yang valid`)
        }

        if (!soal.kunci) {
          throw new Error(`Soal nomor ${index + 1} tidak memiliki kunci jawaban yang benar`)
        }

        // Validasi kunci jawaban
        if (!['A', 'B', 'C', 'D', 'E'].includes(soal.kunci)) {
          throw new Error(`Kunci jawaban soal nomor ${index + 1} tidak valid`)
        }
      }

      // Dapatkan payload dari request untuk info bank soal
      const payload = request.only([
        'namaUjian',
        'jenjang',
        'jurusan',
        'jenisUjian',
        'penulis',
        'kode',
        'mapel',
        'waktu',
        'tanggalUjian',
      ])

      // Format data soal untuk disimpan
      const soalContent = soalData.map((soal) => ({
        id: soal.id,
        soal: soal.soal,
        A: soal.jawaban.A.text,
        B: soal.jawaban.B.text,
        C: soal.jawaban.C.text,
        D: soal.jawaban.D.text,
        E: soal.jawaban.E.text,
        kunci: soal.kunci,
        selected:
          payload.jenisUjian === 'Ujian Mandiri'
            ? true
            : payload.jenisUjian === 'PAS' || payload.jenisUjian === 'PAT'
              ? false
              : false,
      }))

      // Buat file soal terenkripsi
      const fileName = `${payload.namaUjian || 'imported-soal'}-${Date.now()}.opz`
      const filePath = join(app.makePath('storage/soal_files'), fileName)

      // Pastikan direktori ada
      await mkdir(app.makePath('storage/soal_files'), { recursive: true })

      // Enkripsi dan simpan file
      const encryptedContent = encryption.encrypt(JSON.stringify(soalContent, null, 2))
      await writeFile(filePath, encryptedContent)

      // Simpan ke database
      await BankSoal.create(
        {
          namaUjian: payload.namaUjian,
          jenjang: payload.jenjang,
          jurusan: payload.jurusan,
          jenisUjian: payload.jenisUjian as any,
          penulis: payload.penulis || [user.id],
          kode: payload.kode,
          mapelId: payload.mapel,
          waktu: payload.waktu,
          tanggalUjian: payload.tanggalUjian,
          soalFile: fileName,
        },
        { client: trx }
      )

      await trx.commit()

      session.flash({
        status: 'success',
        message: `Berhasil mengimpor ${soalData.length} soal dari file Excel.`,
      })

      return response.redirect().withQs().back()
    } catch (error) {
      await trx.rollback()
      logger.error({ err: error }, 'Gagal mengimpor soal dari Excel')

      session.flash({
        status: 'error',
        message: 'Gagal mengimpor soal dari Excel',
        error: error.message,
      })

      return response.redirect().withQs().back()
    }
  }

  public async previewExcelImport({ request, response }: HttpContext) {
    try {
      const excelFile = request.file('excel_file', {
        size: '10mb',
        extnames: ['xlsx', 'xls'],
      })

      if (!excelFile) {
        return response.status(400).json({
          success: false,
          message: 'File Excel tidak ditemukan',
        })
      }

      if (!excelFile.isValid) {
        return response.status(400).json({
          success: false,
          message: excelFile.errors[0]?.message || 'File Excel tidak valid',
        })
      }

      // Baca file Excel
      const workbook = new ExcelJS.Workbook()
      await workbook.xlsx.readFile(excelFile.tmpPath as any)

      const worksheet = workbook.worksheets[0]

      if (!worksheet) {
        return response.status(400).json({
          success: false,
          message: 'Worksheet tidak ditemukan',
        })
      }

      const soalData = []
      let currentSoal = null
      let soalCounter = 1
      let mulaiMembaca = false

      // Cari mulai baris yang berisi data soal
      for (let rowNumber = 1; rowNumber <= worksheet.rowCount; rowNumber++) {
        const row = worksheet.getRow(rowNumber)

        // Kolom berdasarkan file contoh:
        // A: No (col 1)
        // B: Jenis (col 2)
        // C: Kode (col 3)
        // D: Isi (col 4)
        // E: Status Jawaban (col 5)
        // F: Tingkat kesulitan Soal (col 6)
        // H: LAMPIRAN GAMBAR SOAL (col 8)

        const cellA = row.getCell(1).value?.toString()?.trim() || ''
        const cellB = row.getCell(2).value?.toString()?.trim() || ''
        const cellC = row.getCell(3).value?.toString()?.trim() || ''
        const cellD = row.getCell(4).value?.toString()?.trim() || ''
        const cellE = row.getCell(5).value?.toString()?.trim() || '0'
        const cellF = row.getCell(6).value?.toString()?.trim() || '5'

        // Cari baris header
        if (cellA === 'No' && cellB === 'Jenis' && cellC === 'Kode') {
          mulaiMembaca = true
          continue
        }

        if (!mulaiMembaca) {
          continue
        }

        // Skip baris kosong
        if (!cellA && !cellB && !cellC && !cellD) {
          continue
        }

        const noSoal = parseInt(cellA) || 0
        const jenis = cellB?.toUpperCase() || ''
        const kode = cellC?.toUpperCase() || ''
        const isi = cellD || ''
        const statusJawaban = parseInt(cellE) || 0
        const tingkatKesulitan = parseInt(cellF) || 5

        // Jika baris baru dengan nomor soal (jenis = SOAL, kode = Q)
        if (jenis === 'SOAL' && kode === 'Q') {
          // Simpan soal sebelumnya jika ada
          if (currentSoal) {
            // Validasi soal sebelum disimpan
            if (currentSoal.soal && currentSoal.soal.trim() !== '') {
              soalData.push(currentSoal)
            }
          }

          // Buat objek soal baru
          currentSoal = {
            id: soalCounter++,
            soal: this.formatSoalToHTML(isi),
            jawaban: {
              A: { text: '-', isCorrect: false },
              B: { text: '-', isCorrect: false },
              C: { text: '-', isCorrect: false },
              D: { text: '-', isCorrect: false },
              E: { text: '-', isCorrect: false },
            },
            kunci: null,
            tingkatKesulitan: tingkatKesulitan,
          }
        }

        // Jika baris jawaban (jenis = JAWABAN, kode = A) dan ada soal aktif
        else if (jenis === 'JAWABAN' && kode === 'A' && currentSoal) {
          // Tentukan pilihan jawaban (A-E) berdasarkan urutan kosong
          const jawabanOptions = ['A', 'B', 'C', 'D', 'E']
          let pilihan = ''

          // Cari pilihan yang masih kosong (-) atau belum diisi
          for (const option of jawabanOptions) {
            if (currentSoal.jawaban[option]?.text === '-') {
              pilihan = option
              break
            }
          }

          // Jika semua sudah terisi, mungkin ada lebih dari 5 jawaban, skip
          if (!pilihan) {
            continue
          }

          // Format isi jawaban ke HTML
          const jawabanHTML = isi.trim() !== '' ? this.formatJawabanToHTML(isi) : '-'

          // Update jawaban
          currentSoal.jawaban[pilihan as keyof typeof currentSoal.jawaban] = {
            text: jawabanHTML,
            isCorrect: statusJawaban === 1,
          }

          // Jika ini jawaban yang benar, set kunci
          if (statusJawaban === 1) {
            currentSoal.kunci = pilihan as any
          }
        }

        // Jika baris dengan nomor baru tapi bukan SOAL atau JAWABAN
        // (mungkin format berbeda), reset currentSoal
        else if (noSoal > 0 && !(jenis === 'SOAL' || jenis === 'JAWABAN')) {
          if (currentSoal && currentSoal.soal && currentSoal.soal.trim() !== '') {
            soalData.push(currentSoal)
          }
          currentSoal = null
        }
      }

      // Tambahkan soal terakhir jika ada
      if (currentSoal && currentSoal.soal && currentSoal.soal.trim() !== '') {
        soalData.push(currentSoal)
      }

      // Validasi setiap soal memiliki kunci jawaban
      const validatedSoalData = soalData.filter((soal) => {
        // Cek apakah ada kunci jawaban
        if (!soal.kunci) {
          // Coba cari kunci dari jawaban yang ada
          for (const [key, jawaban] of Object.entries(soal.jawaban)) {
            if (jawaban.isCorrect) {
              soal.kunci = key as any
              return true
            }
          }
          return false
        }
        return true
      })

      return response.json({
        success: true,
        data: validatedSoalData,
        count: validatedSoalData.length,
        warnings:
          validatedSoalData.length !== soalData.length
            ? `Beberapa soal tidak memiliki kunci jawaban yang valid (${soalData.length - validatedSoalData.length} soal diabaikan)`
            : null,
      })
    } catch (error) {
      logger.error({ err: error }, 'Gagal membaca file Excel')
      return response.status(500).json({
        success: false,
        message: 'Gagal membaca file Excel: ' + error.message,
      })
    }
  }

  /**
   * Helper function untuk format soal ke HTML
   */
  private formatSoalToHTML(text: string): string {
    if (!text || text.trim() === '') return ''

    // Escape karakter khusus HTML
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

    // Konversi newline ke <br>
    html = html.replace(/\n/g, '<br>')

    // Deteksi dan format beberapa pattern sederhana
    // **teks** untuk bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // *teks* untuk italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

    // _teks_ untuk underline
    html = html.replace(/_(.*?)_/g, '<u>$1</u>')

    // Deteksi URL sederhana
    html = html.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    )

    return `<div class="soal-content">${html}</div>`
  }

  /**
   * Helper function untuk format jawaban ke HTML
   */
  private formatJawabanToHTML(text: string): string {
    if (!text || text.trim() === '' || text === '-') return '-'

    // Escape karakter khusus HTML
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

    // Konversi newline ke <br>
    html = html.replace(/\n/g, '<br>')

    // Format sederhana untuk jawaban
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

    return `<div class="jawaban-content">${html}</div>`
  }

  private formatToHTML(text: string): string {
    if (!text) return ''

    // Escape karakter khusus HTML
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')

    // Konversi newline ke <br>
    html = html.replace(/\n/g, '<br>')

    // Deteksi dan format beberapa pattern sederhana
    // **teks** untuk bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

    // *teks* untuk italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

    // _teks_ untuk underline
    html = html.replace(/_(.*?)_/g, '<u>$1</u>')

    // Deteksi URL sederhana
    html = html.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    )

    return `<div class="soal-content">${html}</div>`
  }
}
