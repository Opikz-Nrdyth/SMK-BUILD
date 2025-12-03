// resources/js/Pages/Nilai/Index.tsx
import { useState, useEffect } from 'react'
import { router, usePage } from '@inertiajs/react'
import DataTable from '~/Components/TabelData'
import { Notification } from '~/Components/Notification'
import SuperAdminLayout from '~/Layouts/SuperAdminLayouts'
import ModalView from '~/Components/ModalView'
import { Nilai } from './types'
import UniversalInput from '~/Components/UniversalInput'
import StafLayout from '~/Layouts/StafLayouts'
import GuruLayout from '~/Layouts/GuruLayouts'
import { useNotification } from '~/Components/NotificationAlert'

export default function Index({
  kehadirans,
  kehadiranPaginate,
  searchQuery = '',
  kelasFilter = '',
  ujianFilter = '',
  namaUjianFilter = '',
  semuaKelas = [],
  listUjian = [],
  selectedUjian = null,
}: {
  kehadirans: Nilai[]
  kehadiranPaginate: any
  searchQuery?: string
  kelasFilter?: string
  ujianFilter?: string
  namaUjianFilter?: string
  semuaKelas: any[]
  listUjian: any[]
  selectedUjian: any
}) {
  const { props } = usePage() as any

  const baseUrl = props?.pattern?.split('/')

  const { notify } = useNotification()

  useEffect(() => {
    if (props?.session?.status) {
      notify(props?.session?.message, props?.session?.status)
    }
  }, [props.session])

  const [data, setData] = useState([])
  const [dataSelected, setDataSelected] = useState<any | null>()
  const [currentPage, setCurrentPage] = useState(kehadiranPaginate?.currentPage || 1)
  const [lastPage, setLastPage] = useState(kehadiranPaginate?.lastPage || 1)
  const [search, setSearch] = useState(searchQuery)
  const [kelasId, setKelasId] = useState(kelasFilter)
  const [ujianId, setUjianId] = useState(ujianFilter)
  const [namaUjian, setNamaUjian] = useState(namaUjianFilter)

  const romanToNumber = (str) => {
    const map = { X: 10, XI: 11, XII: 12 }
    return map[str] || 0
  }

  const sorted = semuaKelas.sort((a, b) => {
    // ambil jenjang dari namaKelas, contoh: "X-TELIND-2"
    const jenjangA = a.namaKelas.split('-')[0]
    const jenjangB = b.namaKelas.split('-')[0]

    const numA = romanToNumber(jenjangA)
    const numB = romanToNumber(jenjangB)

    // sort berdasarkan jenjang dulu
    if (numA !== numB) return numA - numB

    // jika jenjang sama, sort alfabet nama kelas
    return a.namaKelas.localeCompare(b.namaKelas)
  })

  useEffect(() => {
    if (!kehadirans) return

    const newData = [] as any

    kehadirans.map((item: any) => {
      newData.push({
        ...item,
        id: item?.id,
        namaSiswa: item?.user?.fullName || '-',
        email: item?.user?.email || '-',
        nisn: item?.user?.dataSiswa?.nisn || '-',
        namaUjian: item?.ujian?.namaUjian || '-',
        jenisUjian: item?.ujian?.jenisUjian || '-',
        mapel: item?.ujian?.mapel?.namaMataPelajaran || '-',
        mapelId: item?.ujian?.mapel?.id || '-',
        jenjang: item?.ujian?.jenjang || '-',
      })
    })
    setData(newData)
  }, [kehadirans])

  // Handler untuk perubahan kelas
  const handleKelasChange = (value: string) => {
    setKelasId(value)
    setUjianId('') // Reset ujian saat kelas berubah
    applyFilters(value, '', search, 1)
  }

  // Handler untuk perubahan ujian
  const handleUjianChange = (value: string) => {
    setUjianId(value)
    applyFilters(kelasId, value, search, 1)
  }

  // Handler untuk search
  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm)
    applyFilters(kelasId, ujianId, searchTerm, 1)
  }

  // Fungsi untuk apply semua filter
  const applyFilters = (kelas: string, ujian: string, searchTerm: string, page: number) => {
    router.get(
      `/${baseUrl[1]}/laporan-nilai`,
      {
        page,
        search: searchTerm,
        kelas_id: kelas,
        ujian_id: ujian,
      },
      {
        preserveState: true,
        replace: true,
        preserveScroll: true,
      }
    )
    setCurrentPage(page)
  }

  // Handler untuk halaman berubah
  const handlePageChange = (page: number) => {
    applyFilters(kelasId, ujianId, search, page)
  }

  // Reset semua filter
  const handleResetFilters = () => {
    setKelasId('')
    setUjianId('')
    setSearch('')
    applyFilters('', '', '', 1)
  }

  // Export Excel
  const getExportUrl = () => {
    const params = new URLSearchParams()
    if (kelasId) params.append('kelas', kelasId)
    if (ujianId) params.append('ujian', ujianId)
    if (selectedUjian?.mapel?.namaMataPelajaran) {
      params.append('mapel', selectedUjian.mapel.namaMataPelajaran)
    }
    return `${props.pattern}/cetak?${params.toString()}`
  }

  // Render Header berdasarkan filter yang aktif
  const renderHeader = () => {
    const kelas = semuaKelas.find((k) => k.id === kelasId)
    const ujian = listUjian.find((u) => u.id === ujianId) || selectedUjian

    return (
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {kelas ? `Laporan Nilai - ${kelas.namaKelas}` : 'Laporan Nilai'}
        </h1>
        {ujian && (
          <p className="text-gray-600 dark:text-gray-400">
            Ujian: {ujian.namaUjian} ({ujian.mapel?.namaMataPelajaran})
          </p>
        )}
        {kelas && !ujian && (
          <p className="text-gray-600 dark:text-gray-400">
            {kelas.jenjang} - {kelas.namaKelas}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto lg:p-6">
      <Notification />

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {renderHeader()}
        {(kelasId || ujianId) && (
          <a
            href={getExportUrl()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors duration-200"
          >
            <i className="fa-solid fa-file-excel mr-2"></i> Export Excel
          </a>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 border border-purple-200 dark:border-purple-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Filter Laporan</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filter Kelas */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pilih Kelas
            </label>
            <select
              value={kelasId}
              onChange={(e) => handleKelasChange(e.target.value)}
              className="w-full px-3 py-2 rounded-md border bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="">Semua Kelas</option>
              {sorted.map((kelas) => (
                <option key={kelas.id} value={kelas.id}>
                  {kelas.namaKelas}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Ujian */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pilih Ujian
            </label>
            <select
              value={ujianId}
              onChange={(e) => handleUjianChange(e.target.value)}
              disabled={!kelasId}
              className="w-full px-3 py-2 rounded-md border bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            >
              <option value="">Semua Ujian</option>
              {listUjian.map((ujian) => (
                <option key={ujian.id} value={ujian.id}>
                  {ujian.namaUjian} - {ujian.mapel?.namaMataPelajaran}
                </option>
              ))}
            </select>
            {!kelasId && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Pilih kelas terlebih dahulu
              </p>
            )}
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cari Siswa
            </label>
            <div className="flex">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch(search)}
                placeholder="Cari nama siswa atau NISN..."
                className="w-full px-3 py-2 rounded-l-md border bg-white border-gray-300 text-gray-900 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                onClick={() => handleSearch(search)}
                className="px-4 py-2 bg-purple-600 text-white rounded-r-md hover:bg-purple-700"
              >
                <i className="fa-solid fa-search"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="mt-4">
          <button
            onClick={handleResetFilters}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 transition-colors duration-200"
          >
            <i className="fa-solid fa-rotate-left mr-2"></i> Reset Filter
          </button>
        </div>
      </div>

      {/* Info Summary */}
      {(kelasId || ujianId) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-blue-200 dark:border-blue-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Siswa</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {new Set(data.map((item: any) => item.userId)).size}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-green-200 dark:border-green-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Ujian</div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.length}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 border border-yellow-200 dark:border-yellow-800">
            <div className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Nilai</div>
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {data.length > 0
                ? (
                    data.reduce((sum: number, item: any) => sum + (parseFloat(item.skor) || 0), 0) /
                    data.length
                  ).toFixed(2)
                : '0.00'}
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        data={data}
        tabelName="Laporan Nilai"
        columns={[
          { header: 'NISN', accessor: 'nisn' as const },
          { header: 'Nama Siswa', accessor: 'namaSiswa' as const },
          { header: 'Kelas', accessor: 'jenjang' as const },
          { header: 'Mata Pelajaran', accessor: 'mapel' as const },
          { header: 'Ujian', accessor: 'namaUjian' as const },
          { header: 'Nilai', accessor: 'skor' as const },
          { header: 'Status', accessor: 'status' as const },
          {
            header: 'Tanggal',
            isTime: { mode: 'date', withDay: true },
            accessor: 'createdAt' as const,
          },
        ]}
        pageSize={15}
        placeholder="Cari data..."
        noDataText={
          kelasId || ujianId
            ? 'Tidak ada data untuk filter yang dipilih'
            : 'Pilih filter untuk melihat data'
        }
        onRowClick={(value: any) => {
          const newValue = {
            nisn: value.nisn,
            nama: value.namaSiswa,
            ujian: value.namaUjian,
            totalSoal: value.totalSoal,
            terjawab: value.terjawab,
            tidakTerjawab: value.tidakTerjawab,
            status: value.status,
            nilai: {
              benar: value.benar,
              salah: value.salah,
              skor: Number(value.skor).toFixed(1),
            },
          }

          setDataSelected(newValue)
        }}
        viewModal={true}
        serverPagination={{
          currentPage,
          lastPage,
          total: kehadiranPaginate?.total || 0,
          onPageChange: handlePageChange,
        }}
        serverSearch={{
          value: search,
          onChange: handleSearch,
        }}
      />

      {/* Modal Detail */}
      <ModalView
        data={dataSelected}
        exclude={['*id', 'userId', 'ujianId', 'jawabanFile', 'ujian', '*mapelId', 'user']}
        open={!!dataSelected}
        onClose={() => setDataSelected(null)}
      />
    </div>
  )
}

Index.layout = (page: any) => {
  const activeRole = page.props.activeRole ?? page.props.user.role
  if (activeRole == 'Staf') {
    return <StafLayout>{page}</StafLayout>
  }
  if (activeRole == 'Guru') {
    return <GuruLayout>{page}</GuruLayout>
  }

  return <SuperAdminLayout>{page}</SuperAdminLayout>
}
