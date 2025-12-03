import router from '@adonisjs/core/services/router';
import { middleware } from './kernel.js';
import DashboardSasController from '#controllers/dashboard_sas_controller';
import DataSiswasController from '#controllers/data_siswas_controller';
import BankSoalsController from '#controllers/bank_soals_controller';
import DataJawabansController from '#controllers/data_jawabans_controller';
import DataAbsensiController from '#controllers/data_absensis_controller';
import PengelolaanNilaiController from '#controllers/pengelolaan_nilais_controller';
import DataInformasiController from '#controllers/data_informasis_controller';
import DataPembayaranController from '#controllers/data_pembayarans_controller';
import DataAbsensiWaliKelasController from '#controllers/data_absensi_wali_kelas_controller';
import UserAccountController from '#controllers/user_account_controller';
import RekapNilaisController from '#controllers/rekap_nilais_controller';
router
    .group(() => {
    router.get('/', [DashboardSasController, 'Guru']).as('guru.index');
    router.get('/manajemen-siswa', [DataSiswasController, 'indexGuru']).as('guru.siswa');
    router.group(() => {
        router
            .resource('/bank-soal', BankSoalsController)
            .only(['store', 'update', 'destroy'])
            .as('guru.bankSoal');
        router.get('/bank-soal/', [BankSoalsController, 'indexGuru']).as('guru.bankSoal.index');
        router
            .get('/bank-soal/create', [BankSoalsController, 'createGuru'])
            .as('guru.bankSoal.create');
        router.get('/bank-soal/:id/edit', [BankSoalsController, 'editGuru']).as('guru.bankSoal.edit');
        router
            .get('/bank-soal/:id/file', [BankSoalsController, 'getFileContent'])
            .as('guru.bankSoal.getFile');
        router
            .get('bank-soal/:id/edit-soal', [BankSoalsController, 'editSoal'])
            .as('guru.bankSoal.editSoal');
        router
            .put('bank-soal/:id/update-soal', [BankSoalsController, 'updateSoal'])
            .as('guru.bankSoal.updateSoal');
        router
            .put('bank-soal/importExcell', [BankSoalsController, 'importFromExcel'])
            .as('guru.bankSoal.excell');
        router.get('/manajemen-kehadiran', [DataJawabansController, 'index']).as('guru.kehadiran');
        router
            .get('/manajemen-kehadiran/:id/file', [DataJawabansController, 'getFileContent'])
            .as('guru.kehadiran.fileJawaban');
    });
    router.group(() => {
        router.get('/laporan-nilai', [DataJawabansController, 'indexNilai']).as('guru.nilai');
        router.get('/laporan-nilai/cetak', [DataJawabansController, 'export']).as('guru.nilai.cetak');
        router
            .get('/pengelolaan-nilai', [PengelolaanNilaiController, 'index'])
            .as('guru.pengelolaan_nilai');
        router
            .get('/pengelolaan-nilai/data/:id', [PengelolaanNilaiController, 'getMapelByKelas'])
            .as('guru.pengelolaan_nilai.mapel');
        router
            .get('/pengelolaan-nilai/dataUjian/:jenjang/:mapelId', [
            PengelolaanNilaiController,
            'getUjian',
        ])
            .as('guru.pengelolaan_nilai.ujian');
        router
            .get('/pengelolaan-nilai/dataNilai/:kelas/:mapel/:ujian', [
            PengelolaanNilaiController,
            'getNilai',
        ])
            .as('guru.pengelolaan_nilai.nilai');
        router
            .post('/pengelolaan-nilai/save/:kelas/:mapel/:ujian', [PengelolaanNilaiController, 'save'])
            .as('guru.pengelolaan_nilai.save');
        router.get('/rekap-nilai', [RekapNilaisController, 'index']).as('guru.rekap_nilai');
        router
            .get('/rekap-nilai/:kelasId/:jenisUjian/nilai', [RekapNilaisController, 'getNilai'])
            .as('guru.getNilai');
        router
            .get('/rekap-nilai/:kelasId/kelas', [RekapNilaisController, 'getKelas'])
            .as('guru.getKelas');
    });
    router.group(() => {
        router
            .resource('/laporan-absensi', DataAbsensiController)
            .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
            .as('guru.absensi');
        router
            .get('/laporan-absensi/siswa/:kelasId', [DataAbsensiController, 'getSiswaByKelas'])
            .as('guru.absensi.get_siswa');
        router
            .get('/laporan-absensi/:userId/siswa', [DataAbsensiController, 'view'])
            .as('guru.absensi.view');
        router
            .post('/laporan-absensi/bulk', [DataAbsensiController, 'storeBulk'])
            .as('guru.absensi.bulk');
    });
    router
        .resource('/manajemen-informasi', DataInformasiController)
        .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
        .as('guru.informasi');
    router.group(() => {
        router
            .resource('/wali-kelas-absensi', DataAbsensiWaliKelasController)
            .only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
            .as('guru.absensiWaliKelas');
        router
            .get('/wali-kelas-absensi/siswa/:kelasId', [
            DataAbsensiWaliKelasController,
            'getSiswaByKelas',
        ])
            .as('guru.absensiWaliKelas.siswaById');
        router
            .post('/wali-kelas-absensi/bulk', [DataAbsensiWaliKelasController, 'storeBulk'])
            .as('guru.absensiWaliKelas.storeBulk');
        router
            .get('/wali-kelas-absensi/offline-stats', [
            DataAbsensiWaliKelasController,
            'getOfflineStats',
        ])
            .as('guru.absensiWaliKelas.offlineStats');
        router
            .resource('/laporan-pembayaran', DataPembayaranController)
            .only(['index'])
            .as('guru.pembayaran');
    });
    router.get('/account', [UserAccountController, 'index']).as('guru.account.index');
    router.get('/account/edit', [UserAccountController, 'edit']).as('guru.account.edit');
    router.put('/account/update', [UserAccountController, 'update']).as('guru.account.update');
})
    .prefix('guru')
    .use([middleware.auth(), middleware.roleManajemen(['Guru']), middleware.webData()]);
//# sourceMappingURL=guru-routes.js.map