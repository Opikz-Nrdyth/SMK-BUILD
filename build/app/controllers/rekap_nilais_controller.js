import BankSoal from '#models/bank_soal';
import DataKelas from '#models/data_kelas';
import PengelolaanNilai from '#models/pengelolaan_nilai';
import User from '#models/user';
import fs from 'fs';
import { join } from 'path';
import app from '@adonisjs/core/services/app';
import DataSiswa from '#models/data_siswa';
export default class RekapNilaisController {
    async index({ inertia, auth }) {
        const userId = auth.user;
        const dataGuru = await User.query().where('id', userId.id).preload('dataGuru').first();
        if (!dataGuru?.dataGuru) {
            return inertia.render('Nilai/RekapNilai', {
                dataKelas: [],
            });
        }
        const dataKelas = await DataKelas.query().where('waliKelas', String(dataGuru.dataGuru.nip));
        return inertia.render('Nilai/RekapNilai', {
            dataKelas: dataKelas.map((k) => k.serialize()),
        });
    }
    async getNilai({ params, response }) {
        const { kelasId, jenisUjian } = params;
        try {
            const dataUjian = await BankSoal.query().where('jenisUjian', jenisUjian);
            if (dataUjian.length === 0) {
                return response.json([]);
            }
            const ujianIds = dataUjian.map((ujian) => ujian.id);
            const dataPengelolaanNilai = await PengelolaanNilai.query()
                .where('kelasId', kelasId)
                .whereIn('ujianId', ujianIds);
            const result = await Promise.all(dataPengelolaanNilai.map(async (nilaiRecord) => {
                try {
                    const fileName = nilaiRecord.dataNilai;
                    const filePathNilai = join(app.makePath('storage/nilai'), fileName);
                    const fileContent = fs.readFileSync(filePathNilai, 'utf-8');
                    const jsonData = JSON.parse(fileContent);
                    const extractedData = {
                        namaMapel: jsonData.metadata?.mapelName || 'Unknown Mapel',
                        dataNilai: jsonData.data?.map((siswa) => ({
                            nisn: siswa.nisn,
                            nama: siswa.nama,
                            nilaiRaport: siswa.calculated?.nilaiRaport || '0',
                        })) || [],
                    };
                    return extractedData;
                }
                catch (error) {
                    console.error(`Error processing file ${nilaiRecord.dataNilai}:`, error);
                    return {
                        namaMapel: 'Error Loading Mapel',
                        dataNilai: [],
                    };
                }
            }));
            const filteredResult = result.filter((item) => item.dataNilai.length > 0);
            return response.json(filteredResult);
        }
        catch (error) {
            return response.status(500).json({
                message: 'Terjadi kesalahan saat mengambil data nilai',
                error: error.message,
            });
        }
    }
    async getKelas({ params, response }) {
        const { kelasId } = params;
        try {
            const dataKelas = await DataKelas.query().where('id', kelasId).first();
            if (!dataKelas) {
                return response.status(404).json({
                    message: 'Kelas tidak ditemukan',
                });
            }
            let nisnList = [];
            if (typeof dataKelas.siswa === 'string') {
                nisnList = JSON.parse(dataKelas.siswa);
            }
            else if (Array.isArray(dataKelas.siswa)) {
                nisnList = dataKelas.siswa;
            }
            else {
                nisnList = [];
            }
            if (nisnList.length === 0) {
                return response.json([]);
            }
            const dataSiswaKelas = await DataSiswa.query()
                .whereIn('nisn', nisnList)
                .select(['nisn', 'userId'])
                .preload('user', (user) => user.select(['fullName']));
            const dataSiswaKelasConvert = dataSiswaKelas.map((item) => ({
                nisn: item.nisn,
                nama: item.user.fullName,
            }));
            return response.json(dataSiswaKelasConvert);
        }
        catch (error) {
            return response.status(500).json({
                message: 'Terjadi kesalahan saat mengambil data siswa',
                error: error.message,
            });
        }
    }
}
//# sourceMappingURL=rekap_nilais_controller.js.map