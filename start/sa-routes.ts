import DataJawabansController from '#controllers/data_jawabans_controller'
import SuperAdminController from '#controllers/data_super_admin'
import LandingPageController from '#controllers/data_website_controller'
import UserAccountController from '#controllers/user_account_controller'
import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import DashboardSasController from '#controllers/dashboard_sas_controller'
import DataSiswasController from '#controllers/data_siswas_controller'
import DataSiswaPraRegistsController from '#controllers/data_siswa_pra_regists_controller'
import DataGurusController from '#controllers/data_gurus_controller'
import DataStafsController from '#controllers/data_stafs_controller'
import DataKelasController from '#controllers/data_kelas_controller'
import DataJurusansController from '#controllers/data_jurusans_controller'
import DataTahunAjaransController from '#controllers/data_tahun_ajarans_controller'
import DataMapelsController from '#controllers/data_mapels_controller'
import DataWaliKelasController from '#controllers/data_wali_kelas_controller'
import DataAbsensiController from '#controllers/data_absensis_controller'
import DataPembayaranController from '#controllers/data_pembayarans_controller'
import DataWebsite from '#models/data_website'
import DataRecordPembayaransController from '#controllers/data_record_pembayarans_controller'
import DataInformasiController from '#controllers/data_informasis_controller'
import DataAktivitasController from '#controllers/data_aktivitas_controller'
import DataAdsController from '#controllers/data_ads_controller'
import BankSoalsController from '#controllers/bank_soals_controller'
import DataPasswordsController from '#controllers/data_passwords_controller'

// ===============================================SUPER ADMIN===============================================
router
  .group(() => {
    router.get('/', [DashboardSasController, 'SuperAdmin']).as('superadmin.index')

    // ===============================================MANAJEMEN SISWA===============================================
    router.group(() => {
      router
        .resource('/manajemen-siswa', DataSiswasController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('superadmin.siswa')

      router
        .get('/manajemen-siswa/kelas', [DataSiswasController, 'indexPerKelas'])
        .as('superadmin.siswa.kelas')

      router
        .get('/manajemen-siswa/praregist', [DataSiswaPraRegistsController, 'index'])
        .as('superadmin.siswa.praregist')

      router
        .post('/manajemen-siswa/praregist/:nisn/status', [
          DataSiswaPraRegistsController,
          'updateStatus',
        ])
        .as('superadmin.siswa.praregist.status')

      router
        .post('/manajemen-siswa/praregist/:nisn/daftarulang', [
          DataSiswaPraRegistsController,
          'updateToDaftarUlang',
        ])
        .as('superadmin.siswa.praregist.daftarulang')

      router
        .get('/manajemen-siswa/export', [DataSiswasController, 'exportExcel'])
        .as('superadmin.siswa.export')
      router
        .post('/manajemen-siswa/import', [DataSiswasController, 'importExcel'])
        .as('superadmin.siswa.import')

      router
        .post('/manajemen-siswa/:id/resetPassword/', [DataSiswasController, 'resetPassword'])
        .as('superadmin.siswa.resetPassword')
    })

    // ===============================================MANAJEMEN GURU===============================================
    router.group(() => {
      router
        .resource('/manajemen-guru', DataGurusController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('superadmin.guru')

      router
        .get('/manajemen-guru/:id/cekGuru/', [DataGurusController, 'cekUser'])
        .as('superadmin.guru.cekguru')

      router
        .post('/manajemen-guru/:id/resetPassword/', [DataGurusController, 'resetPassword'])
        .as('superadmin.guru.resetPassword')

      router
        .get('/manajemen-guru/export', [DataGurusController, 'exportExcel'])
        .as('superadmin.guru.export')
      router
        .post('/manajemen-guru/import', [DataGurusController, 'importExcel'])
        .as('superadmin.guru.import')
    })

    // ===============================================MANAJEMEN WALI KELAS===============================================
    router
      .resource('/manajemen-wali-kelas', DataWaliKelasController)
      .only(['index'])
      .as('superadmin.wali_kelas')

    // ===============================================MANAJEMEN STAF===============================================
    router.group(() => {
      router
        .resource('/manajemen-staf', DataStafsController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('superadmin.staf')

      router
        .get('/manajemen-staf/:id/cekStaf/', [DataStafsController, 'cekUser'])
        .as('superadmin.staf.cekguru')

      router
        .post('/manajemen-staf/:id/resetPassword/', [DataStafsController, 'resetPassword'])
        .as('superadmin.staf.resetPassword')

      router
        .get('/manajemen-staf/export', [DataStafsController, 'exportExcel'])
        .as('superadmin.staf.export')
      router
        .post('/manajemen-staf/import', [DataStafsController, 'importExcel'])
        .as('superadmin.staf.import')
    })

    // ===============================================DATA SUPER ADMIN===============================================
    router.group(() => {
      router.get('/data-super-admin', [SuperAdminController, 'index'])
      router.post('/data-super-admin/store', [SuperAdminController, 'store'])
      router.delete('/data-super-admin/:id', [SuperAdminController, 'destroy'])
    })

    // ===============================================MANAJEMEN BANK SOAL===============================================
    router.group(() => {
      router
        .resource('/bank-soal', BankSoalsController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('superadmin.bankSoal')

      router
        .get('/bank-soal/:id/file', [BankSoalsController, 'getFileContent'])
        .as('superadmin.bankSoal.getFile')
      router
        .get('bank-soal/:id/edit-soal', [BankSoalsController, 'editSoal'])
        .as('superadmin.bankSoal.editSoal')
      router
        .get('bank-soal/:id/selected-soal', [BankSoalsController, 'selectedSoal'])
        .as('superadmin.bankSoal.selectedSoal')
      router
        .put('bank-soal/:id/update-soal', [BankSoalsController, 'updateSoal'])
        .as('superadmin.bankSoal.updateSoal')

      router
        .put('bank-soal/importExcell', [BankSoalsController, 'importFromExcel'])
        .as('superadmin.bankSoal.excell')

      router
        .resource('bank-soal/data-password', DataPasswordsController)
        .only(['index', 'store', 'update', 'destroy'])
        .as('superadmin.dataPassword')
    })

    // ===============================================MANAJEMEN JAWABAN===============================================
    router.group(() => {
      router
        .get('/manajemen-kehadiran', [DataJawabansController, 'index'])
        .as('superadmin.kehadiran')

      router.delete('manajemen-kehadiran/:userId/:soalId', [DataJawabansController, 'distroy'])
      router
        .get('/manajemen-kehadiran/ujian', [DataJawabansController, 'ujian'])
        .as('superadmin.kehadiran.ujian')
      router
        .post('/manajemen-kehadiran/start-ujian', [DataJawabansController, 'startUjian'])
        .as('superadmin.kehadiran.start_ujian')
      router
        .post('/manajemen-kehadiran/:id/submit-jawaban', [DataJawabansController, 'submitJawaban'])
        .as('superadmin.kehadiran.submit_jawaban')
      router
        .get('/manajemen-kehadiran/:id/file', [DataJawabansController, 'getFileContent'])
        .as('superadmin.kehadiran.fileJawaban')
    })

    // ===============================================MANAJEMEN PARTISIPASI UJIAN===============================================
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
      .as('superadmin.tahun_ajaran')

    // ===============================================MANAJEMEN JURUSAN===============================================
    router
      .resource('/manajemen-jurusan', DataJurusansController)
      .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
      .as('superadmin.jurusan')

    // ===============================================MANAJEMEN KELAS===============================================
    router
      .resource('/manajemen-kelas', DataKelasController)
      .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
      .as('superadmin.kelas')

    // ===============================================MANAJEMEN MAPEL===============================================
    router
      .resource('/manajemen-mapel', DataMapelsController)
      .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
      .as('superadmin.mapel')

    // ===============================================MANAJEMEN ABSENSI===============================================
    router.group(() => {
      router
        .resource('/laporan-absensi', DataAbsensiController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('superadmin.absensi')

      router
        .get('/laporan-absensi/siswa/:kelasId', [DataAbsensiController, 'getSiswaByKelas'])
        .as('superadmin.absensi.get_siswa')
      router
        .get('/laporan-absensi/:userId/siswa', [DataAbsensiController, 'view'])
        .as('superadmin.absensi.view')
      router
        .post('/laporan-absensi/bulk', [DataAbsensiController, 'storeBulk'])
        .as('superadmin.absensi.bulk')
    })

    // ===============================================LAPORAN PEMBAYARAN===============================================
    router.group(() => {
      router
        .resource('/laporan-pembayaran', DataPembayaranController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('superadmin.pembayaran')

      router
        .post('/laporan-pembayaran/:id/tambah-pembayaran', [
          DataPembayaranController,
          'tambahPembayaran',
        ])
        .as('superadmin.pembayaran.tambah')

      router
        .get('/laporan-pembayaran/check-existing', [DataPembayaranController, 'checkExisting'])
        .as('superadmin.pembayaran.check')

      router
        .get('/laporan-pembayaran/:id/cetak-invoice', [DataPembayaranController, 'cetakInvoice'])
        .as('superadmin.pembayaran.cetak_invoice')

      router
        .get('/laporan-pembayaran/:id/cetak', async ({ inertia, params }) => {
          const dataWebsite = await DataWebsite.getAllSettings()
          return inertia.render('Pembayaran/CetakInvoice', {
            pembayaranId: params.id,
            dataWebsite,
          })
        })
        .as('superadmin.pembayaran.cetak')

      router
        .get('/laporan-pembayaran/penetapan/get', [DataPembayaranController, 'getNominalPenetapan'])
        .as('superadmin.pembayaran.penetapan')

      router
        .get('/laporan-pembayaran/recordMidtrans', [DataRecordPembayaransController, 'index'])
        .as('superadmin.pembayaran.record')
    })

    // ===============================================LAPORAN NILAI===============================================
    router.group(() => {
      router.get('/laporan-nilai', [DataJawabansController, 'indexNilai']).as('superadmin.nilai')
      router
        .get('/laporan-nilai/cetak', [DataJawabansController, 'export'])
        .as('superadmin.nilai.cetak')
    })

    // ===============================================MANAJEMEN PENGUMUMAN===============================================
    router
      .resource('/manajemen-informasi', DataInformasiController)
      .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
      .as('superadmin.informasi')

    // ===============================================MANAJEMEN AKTIVITAS===============================================
    router
      .resource('/manajemen-aktivitas', DataAktivitasController)
      .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
      .as('superadmin.aktivitas')

    // ===============================================MANAJEMEN ADS===============================================
    router
      .resource('/manajemen-ads', DataAdsController)
      .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
      .as('superadmin.ads')

    // ===============================================WHATSAPP===============================================
    router.group(() => {
      router.on('/whatsapp').renderInertia('Whatsapp/Whatsapp')
      router.get('/account', [UserAccountController, 'index']).as('superadmin.account.index')
      router.get('/account/edit', [UserAccountController, 'edit']).as('superadmin.account.edit')
      router
        .put('/account/update', [UserAccountController, 'update'])
        .as('superadmin.account.update')
    })

    // ===============================================SETTINGS===============================================
    router.group(() => {
      router.get('/landing-page', [LandingPageController, 'index'])
      router.post('/landing-page/settings', [LandingPageController, 'update'])
      router.post('/landing-page/upload-fasilitas', [LandingPageController, 'uploadFasilitas'])
    })
  })
  .prefix('SuperAdmin')
  .use([middleware.auth(), middleware.roleManajemen(['SuperAdmin']), middleware.webData()])
