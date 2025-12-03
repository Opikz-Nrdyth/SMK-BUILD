import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import DashboardSasController from '#controllers/dashboard_sas_controller'
import DataSiswasController from '#controllers/data_siswas_controller'
import DataSiswaPraRegistsController from '#controllers/data_siswa_pra_regists_controller'
import DataGurusController from '#controllers/data_gurus_controller'
import DataWaliKelasController from '#controllers/data_wali_kelas_controller'
import DataKelasController from '#controllers/data_kelas_controller'
import DataJurusansController from '#controllers/data_jurusans_controller'
import DataTahunAjaransController from '#controllers/data_tahun_ajarans_controller'
import DataMapelsController from '#controllers/data_mapels_controller'
import DataAktivitasController from '#controllers/data_aktivitas_controller'
import DataAdsController from '#controllers/data_ads_controller'
import DataPembayaranController from '#controllers/data_pembayarans_controller'
import BankSoalsController from '#controllers/bank_soals_controller'
import DataJawabansController from '#controllers/data_jawabans_controller'
import DataRecordPembayaransController from '#controllers/data_record_pembayarans_controller'
import DataWebsite from '#models/data_website'
import DataInformasiController from '#controllers/data_informasis_controller'
import BlogController from '#controllers/blog_controller'
import FileUploadService from '#services/file_upload_service'
import UserAccountController from '#controllers/user_account_controller'

// ===============================================STAF===============================================
router
  .group(() => {
    router.get('/', [DashboardSasController, 'Staf']).as('staf.index')
    // ===============================================STAF ADMINISTRASI===============================================
    router.group(() => {
      // ===============================================MANAJEMEN SISWA===============================================
      router.group(() => {
        router
          .resource('/manajemen-siswa', DataSiswasController)
          .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
          .as('staf.siswa')

        router
          .get('/manajemen-siswa/praregist', [DataSiswaPraRegistsController, 'index'])
          .as('staf.siswa.praregist')

        router
          .get('/manajemen-siswa/praregist/:nisn/status', [
            DataSiswaPraRegistsController,
            'updateStatus',
          ])
          .as('staf.siswa.praregist.status')

        router
          .get('/manajemen-siswa/praregist/:nisn/daftarulang', [
            DataSiswaPraRegistsController,
            'updateToDaftarUlang',
          ])
          .as('staf.siswa.praregist.daftarulang')

        router
          .get('/manajemen-siswa/kelas', [DataSiswasController, 'indexPerKelas'])
          .as('staf.siswa.kelas')

        router
          .get('/manajemen-siswa/export', [DataSiswasController, 'exportExcel'])
          .as('staf.export')

        router
          .post('/manajemen-siswa/import', [DataSiswasController, 'importExcel'])
          .as('staf.import')

        router
          .post('/manajemen-siswa/:id/resetPassword/', [DataSiswasController, 'resetPassword'])
          .as('staf.siswa.resetPassword')
      })

      // ===============================================MANAJEMEN GURU===============================================
      router.group(() => {
        router
          .resource('/manajemen-guru', DataGurusController)
          .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
          .as('staf.guru')

        router
          .get('/manajemen-guru/:id/cekGuru/', [DataGurusController, 'cekUser'])
          .as('staf.guru.cekguru')

        router
          .post('/manajemen-guru/:id/resetPassword/', [DataGurusController, 'resetPassword'])
          .as('staf.guru.resetPassword')

        router
          .get('/manajemen-guru/export', [DataGurusController, 'exportExcel'])
          .as('staf.guru.export')

        router
          .post('/manajemen-guru/import', [DataGurusController, 'importExcel'])
          .as('staf.guru.import')
      })

      // ===============================================MANAJEMEN WALI KELAS===============================================
      router
        .resource('/manajemen-wali-kelas', DataWaliKelasController)
        .only(['index'])
        .as('staf.wali_kelas')

      // ===============================================MANAJEMEN UJIAN===============================================
      router.group(() => {
        router
          .resource('/bank-soal', BankSoalsController)
          .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
          .as('staf.bankSoal')

        router
          .get('/bank-soal/:id/file', [BankSoalsController, 'getFileContent'])
          .as('staf.bankSoal.getFile')
        router
          .get('bank-soal/:id/edit-soal', [BankSoalsController, 'editSoal'])
          .as('staf.bankSoal.editSoal')
        router
          .get('bank-soal/:id/selected-soal', [BankSoalsController, 'selectedSoal'])
          .as('staf.bankSoal.selectedSoal')
        router
          .put('bank-soal/:id/update-soal', [BankSoalsController, 'updateSoal'])
          .as('staf.bankSoal.updateSoal')

        router
          .put('bank-soal/importExcell', [BankSoalsController, 'importFromExcel'])
          .as('staf.bankSoal.excell')
      })

      router.get('/laporan-nilai', [DataJawabansController, 'indexNilai']).as('staf.nilai')

      // ===============================================PARTISIPASI UJIAN===============================================
      router.group(() => {
        router.get('/partisipasi-ujian', [DataPembayaranController, 'partisipasiUjian'])

        router.post('/partisipasi-ujian/update-partisipasi-ujian', [
          DataPembayaranController,
          'updatePartisipasiUjian',
        ])

        router.post('/partisipasi-ujian/bulk-update-partisipasi-ujian', [
          DataPembayaranController,
          'bulkUpdatePartisipasiUjian',
        ])
      })

      // ===============================================MANAJEMEN TAHUN AJARAN===============================================
      router
        .resource('/manajemen-tahun-ajaran', DataTahunAjaransController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('staf.tahun_ajaran')

      // ===============================================MANAJEMEN JURUSAN===============================================
      router
        .resource('/manajemen-jurusan', DataJurusansController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('staf.jurusan')

      // ===============================================MANAJEMEN KELAS===============================================
      router
        .resource('/manajemen-kelas', DataKelasController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('staf.kelas')

      // ===============================================MANAJEMEN MAPEL===============================================
      router
        .resource('/manajemen-mapel', DataMapelsController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('staf.mapel')
    })

    // ===============================================STAF KEUANGAN===============================================
    router.group(() => {
      router.group(() => {
        // ===============================================LAPORAN PEMBAYARAN===============================================
        router.group(() => {
          router
            .resource('/laporan-pembayaran', DataPembayaranController)
            .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
            .as('staf.pembayaran')

          router
            .post('/laporan-pembayaran/:id/tambah-pembayaran', [
              DataPembayaranController,
              'tambahPembayaran',
            ])
            .as('staf.pembayaran.tambah')

          router
            .get('/laporan-pembayaran/check-existing', [DataPembayaranController, 'checkExisting'])
            .as('staf.pembayaran.check')

          router
            .get('/laporan-pembayaran/:id/cetak-invoice', [
              DataPembayaranController,
              'cetakInvoice',
            ])
            .as('staf.pembayaran.cetak_invoice')

          router
            .get('/laporan-pembayaran/:id/cetak', async ({ inertia, params }) => {
              const dataWebsite = await DataWebsite.getAllSettings()
              return inertia.render('Pembayaran/CetakInvoice', {
                pembayaranId: params.id,
                dataWebsite,
              })
            })
            .as('staf.pembayaran.cetak')

          router
            .get('/laporan-pembayaran/penetapan/get', [
              DataPembayaranController,
              'getNominalPenetapan',
            ])
            .as('staf.pembayaran.penetapan')
        })

        // ===============================================LAPORAN MIDTRANS===============================================
        router
          .get('/laporan-pembayaran/recordMidtrans', [DataRecordPembayaransController, 'index'])
          .as('staf.pembayaran.record')
      })
    })

    // ===============================================STAF MULTIMEDIA===============================================
    router.group(() => {
      // ===============================================BLOG===============================================
      router.group(() => {
        router
          .resource('/blogs', BlogController)
          .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
          .as('staf.blog')

        router.get('/uploads/blogs/:fileName', async ({ params, response }) => {
          try {
            const fileService = new FileUploadService()
            const fileBuffer = await fileService.getDecryptedFile(params.fileName, 'blogs')

            // Detect content type dari buffer (sederhana)
            const isPng = fileBuffer.slice(0, 8).toString('hex') === '89504e470d0a1a0a'
            const isJpeg = fileBuffer.slice(0, 2).toString('hex') === 'ffd8'
            const isWebp = fileBuffer.slice(0, 4).toString() === 'RIFF'

            let contentType = 'image/jpeg' // default
            if (isPng) contentType = 'image/png'
            if (isJpeg) contentType = 'image/jpeg'
            if (isWebp) contentType = 'image/webp'

            response.header('Content-Type', contentType)
            response.header('Cache-Control', 'public, max-age=31536000') // Cache 1 tahun

            return response.send(fileBuffer)
          } catch (error) {
            return response.notFound('File not found')
          }
        })
      })

      // ===============================================MANAJEMEN AKTIVITAS===============================================
      router
        .resource('/aktivitas', DataAktivitasController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('staf.aktivitas')

      // ===============================================MANAJEMEN ADS===============================================
      router
        .resource('/ads', DataAdsController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('staf.ads')

      // ===============================================MANAJEMEN INFORMASI===============================================
      router
        .resource('/manajemen-informasi', DataInformasiController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('staf.informasi')
    })

    router.get('/account', [UserAccountController, 'index']).as('staf.account.index')
    router.get('/account/edit', [UserAccountController, 'edit']).as('staf.account.edit')
    router.put('/account/update', [UserAccountController, 'update']).as('staf.account.update')
  })
  .prefix('staf')
  .use([middleware.auth(), middleware.roleManajemen(['Staf']), middleware.webData()])
