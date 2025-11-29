import router from '@adonisjs/core/services/router'
import { middleware } from './kernel.js'
import UjiansController from '#controllers/ujians_controller'
import DataJawabansController from '#controllers/data_jawabans_controller'
import SiswaAbsensiController from '#controllers/siswa_absensi_controller'
import DataPembayaranController from '#controllers/data_pembayarans_controller'
import UserAccountController from '#controllers/user_account_controller'
import DashboardSasController from '#controllers/dashboard_sas_controller'

// ===============================================SISWA===============================================
router
  .group(() => {
    router.get('/jadwalujian', [UjiansController, 'jadwalUjian'])
    router.get('/ujian/:id', [UjiansController, 'mulaiUjian'])
    router.post('/ujian/:id/saveJawaban', [UjiansController, 'saveJawaban'])
    router.post('/ujian/:id/submitJawaban', [UjiansController, 'submitJawaban'])
    router.get('/riwayatujian', [DataJawabansController, 'indexSiswa'])
    router.get('/preview/:id', [DataJawabansController, 'previewJawaban'])
    router.get('/absensi', [SiswaAbsensiController, 'index'])
    router.get('/absensi/mapel/:mapelId', [SiswaAbsensiController, 'detailMapel'])
    router.get('/tagihan', [DataPembayaranController, 'indexSiswa'])
    router.get('/acc', [DataPembayaranController, 'indexSiswa'])
    router.get('/account', [UserAccountController, 'index']).as('siswa.account.index')
    router.get('/account/edit', [UserAccountController, 'edit']).as('siswa.account.edit')
    router.put('/account/update', [UserAccountController, 'update']).as('siswa.account.update')
    router.get('/:month?', [DashboardSasController, 'Siswa'])
    router.post('/pembayaran/midtrans/initiate', [DataPembayaranController, 'initiateMidtrans'])
  })
  .prefix('siswa')
  .use([middleware.auth(), middleware.roleManajemen(['Siswa']), middleware.webData()])
