import React, { useEffect, useState } from 'react'
import { usePage, router, Link } from '@inertiajs/react'
import { Notification } from '~/Components/Notification'
import DataTable from '~/Components/TabelData'
import ModalView from '~/Components/ModalView'
import SuperAdminLayout from '~/Layouts/SuperAdminLayouts'
import GuruLayout from '~/Layouts/GuruLayouts'
import StafLayout from '~/Layouts/StafLayouts'
import { DateTime } from 'luxon'

// Definisikan tipe data yang diterima dari Controller
interface TransactionRecord {
  id: string // Order ID Midtrans
  pembayaranId: string
  transactionStatus: string
  grossAmount: string
  transactionTime: string
  userName: string
  userEmail: string
  jenisPembayaran: string
  nisn: string
}

export default function TransactionIndex({
  auth,
  transactions,
  pagination,
  filter,
}: {
  auth: any
  transactions: TransactionRecord[]
  pagination: any
  filter: any
}) {
  const { props } = usePage()

  const [data, setData] = useState<any[]>([])
  const [dataSelected, setDataSelected] = useState<TransactionRecord | null>(null)
  const [openData, setOpenData] = useState<any | null>(null)
  const [currentPage, setCurrentPage] = useState(pagination?.currentPage || 1)
  const [search, setSearch] = useState(filter?.search || '')

  useEffect(() => {
    if (!transactions) return

    const newData = transactions.map((item: TransactionRecord) => {
      // Format tanggal dan status untuk tampilan
      const formattedDate = DateTime.fromISO(item.transactionTime).toFormat('dd LLL yyyy, HH:mm')
      const formattedAmount = formatRupiah(parseFloat(item.grossAmount))
      const statusClass = getStatusClass(item.transactionStatus)

      return {
        id: item.id, // Order ID Midtrans
        siswa: item.userName,
        nisn: item.nisn,
        jenisPembayaran: item.jenisPembayaran,
        nominal: formattedAmount,
        waktu: item.transactionTime,
        status: (
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusClass}`}>
            {item.transactionStatus.toUpperCase()}
          </span>
        ),
        statusText: item.transactionStatus.toUpperCase(),
        // Data untuk modal view
        detailData: {
          'Order ID': item.id,
          'Pembayar': item.userName,
          'NISN': item.nisn,
          'Jenis Tagihan': item.jenisPembayaran,
          'Nominal Bayar': formattedAmount,
          'Status': item.transactionStatus.toUpperCase(),
          'Waktu Transaksi': formattedDate,
          'ID Tagihan Lokal': item.pembayaranId,
        },
        // Data mentah untuk diakses
        rawData: item,
      }
    })
    setData(newData)
    setCurrentPage(pagination?.currentPage || 1)
  }, [transactions, pagination])

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'settlement':
      case 'capture':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'pending':
      case 'authorize':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'expire':
      case 'cancel':
      case 'deny':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    }
  }

  const handlePageChange = (page: number) => {
    router.get(
      String(props.pattern),
      { page, search },
      {
        preserveState: true,
        replace: true,
      }
    )
  }

  useEffect(() => {
    const fetchData = async () => {
      // URL BARU: Panggil endpoint lokal, bukan Midtrans API
      const localResponse = await fetch(`/api/midtrans/status-proxy/${dataSelected?.id}`, {
        method: 'GET',
        headers: {
          // Kirim CSRF Token AdonisJS jika diperlukan untuk POST/PUT/DELETE
          // Untuk GET, hanya auth session/cookies yang dibutuhkan (disediakan oleh Inertia/browser)
        },
      })

      if (localResponse.ok) {
        const data = await localResponse.json()
        const selectedData = getModalData(dataSelected)

        const newRecord = {
          orderId: data.order_id,
          idPembayaran: data.custom_field2,
          Pembayar: selectedData?.Pembayar,
          nominalBayar: formatRupiah(data.gross_amount),
          jenisTagihan: dataSelected?.jenisPembayaran,
          status: data.transaction_status,
          waktuTransaksi: data.transaction_time,
          metodePembayaran: data.payment_type,
          Pesan: data.status_message,
        }

        setOpenData(newRecord)
      }
    }

    // Pastikan ada data yang dipilih sebelum fetch
    if (dataSelected?.id) {
      fetchData()
    }
  }, [dataSelected])

  const handleSearch = (searchTerm: string) => {
    setSearch(searchTerm)
    router.get(
      String(props.pattern),
      { page: 1, search: searchTerm },
      {
        preserveState: true,
        replace: true,
        preserveScroll: true,
      }
    )
  }

  const getModalData = (item: any) => {
    if (!item?.detailData) return {}
    return item.detailData
  }

  const role = (props.user as any).role

  const LayoutComponent =
    role === 'Guru' ? GuruLayout : role === 'Staf' ? StafLayout : SuperAdminLayout

  return (
    <LayoutComponent>
      <div className="max-w-7xl mx-auto lg:p-6">
        <Notification />

        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Record Pembayaran Online
          </h1>
        </div>

        <DataTable
          data={data}
          tabelName="Record Pembayaran Online"
          columns={[
            { header: 'Order ID', accessor: 'id' as const },
            { header: 'Siswa', accessor: 'siswa' as const },
            { header: 'Tagihan', accessor: 'jenisPembayaran' as const },
            { header: 'Nominal', accessor: 'nominal' as const },
            {
              header: 'Waktu Transaksi',
              accessor: 'waktu',
              isTime: { mode: 'datetime', withDay: true } as const,
            },
            { header: 'Status', accessor: 'status' as const },
            {
              header: 'Cetak',
              accessor: 'id',
              action: (row: any) => (
                <>
                  {row.statusText == 'PENDING' && (
                    <Link
                      href={`/api/midtrans/${row.id}/cancel`}
                      className="text-red-600 hover:text-red-800 px-2 font-bold py-1 rounded-md flex items-center gap-1 transition-colors duration-200"
                    >
                      Cancel
                    </Link>
                  )}
                </>
              ),
            },
          ]}
          pageSize={15}
          placeholder="Cari berdasarkan Order ID, Nama Siswa, atau NISN..."
          noDataText="Tidak ada record pembayaran online"
          onRowClick={(value: any) => setDataSelected(value)}
          editable="true"
          serverPagination={{
            currentPage: pagination?.currentPage || 1,
            lastPage: pagination?.lastPage || 1,
            total: pagination?.total || 0,
            onPageChange: handlePageChange,
          }}
          disableConfig={{
            canEdit: () => {
              return false
            },
            canDelete: () => {
              return false
            },
            canView: () => true,
            disabledMessage: 'Guru hanya dapat mengubah Ujian Mandiri yang dibuat sendiri',
          }}
          serverSearch={{
            value: search,
            onChange: handleSearch,
          }}
        />

        <ModalView
          data={openData}
          open={!!openData}
          onClose={() => {
            setDataSelected(null)
            setOpenData(null)
          }}
          title="Detail Transaksi Midtrans"
          exclude={['id', 'pembayaranId']}
        />
      </div>
    </LayoutComponent>
  )
}
