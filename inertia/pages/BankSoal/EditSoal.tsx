// resources/js/Pages/BankSoal/EditSoal.tsx
import React, { useState, useEffect, useRef } from 'react'
import { Link, router, usePage } from '@inertiajs/react'
import { Notification } from '~/Components/Notification'
import SuperAdminLayout from '~/Layouts/SuperAdminLayouts'
import { BankSoal, SoalItem } from './types'
import { offlineStorage } from './offline_soal_service'
import { useNotification } from '~/Components/NotificationAlert'
import GuruLayout from '~/Layouts/GuruLayouts'
import StafLayout from '~/Layouts/StafLayouts'
import UniversalInput from '~/Components/UniversalInput'

interface EditSoalProps {
  bankSoal: BankSoal
  soalContent: SoalItem[]
}

// Interface untuk data preview dari Excel
interface SoalPreview {
  id: number
  soal: string
  jawaban: {
    A: { text: string; isCorrect: boolean }
    B: { text: string; isCorrect: boolean }
    C: { text: string; isCorrect: boolean }
    D: { text: string; isCorrect: boolean }
    E: { text: string; isCorrect: boolean }
  }
  kunci: string
}

export default function EditSoal({ bankSoal, soalContent }: EditSoalProps) {
  const [soals, setSoals] = useState<SoalItem[]>(
    soalContent?.map((soal) => ({
      ...soal,
      syncStatus: 'synced' as const,
    })) || []
  )
  const { props } = usePage() as any
  const pattern = props?.pattern.split('/').filter((item: any) => item != '')
  const url = `/${pattern[0]}/${pattern[1]}`

  const { notify } = useNotification()

  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isStorageSupported, setIsStorageSupported] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')

  // State untuk import Excel
  const [showImportModal, setShowImportModal] = useState(false)
  const [excelFile, setExcelFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<SoalPreview[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Input khusus di atas (untuk edit soal)
  const [editingSoal, setEditingSoal] = useState<SoalItem | null>(null)
  const [quickSoal, setQuickSoal] = useState({
    id: '',
    soal: '',
    A: '',
    B: '',
    C: '',
    D: '',
    E: '',
    kunci: 'A' as const,
  })

  useEffect(() => {
    setIsStorageSupported(offlineStorage.isStorageSupported())
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    const soals = soalContent.map((item) => ({
      ...item,
      syncStatus: 'synced' as const,
    }))

    const getPendingData = async () => {
      const storagePending = await offlineStorage.getPendingSoal()
      const uniquePending = storagePending.filter(
        (pending) =>
          !soals.some(
            (s) =>
              s.soal === pending.soal &&
              s.A === pending.A &&
              s.B === pending.B &&
              s.C === pending.C &&
              s.D === pending.D &&
              s.E === pending.E &&
              s.kunci === pending.kunci
          )
      )

      const pendingSoal = [...soals, ...uniquePending]
      setSoals(pendingSoal)
    }

    getPendingData()
  }, [soalContent])

  useEffect(() => {
    if (isOnline && isStorageSupported) {
      checkPendingData()
    }
  }, [isOnline, isStorageSupported])

  const checkPendingData = async () => {
    try {
      const pendingData = await offlineStorage.getPendingSoal()
      setPendingCount(pendingData?.length)
    } catch (error) {
      console.error('Error checking pending data:', error)
    }
  }

  // ========== FUNGSI IMPORT EXCEL ==========
  const handleFileUpload = async (file: File) => {
    if (!file) return

    const formData = new FormData()
    formData.append('excel_file', file)
    formData.append('bank_soal_id', bankSoal.id.toString())

    try {
      setImportLoading(true)
      const response = await fetch(`/api/import-excel-preview`, {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN':
            document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
        },
      })

      if (response.ok) {
        const data = await response.json()
        console.log(data)

        if (data.success) {
          setPreviewData(data.data)
          setExcelFile(file)
          notify(`Berhasil membaca ${data.data.length} soal dari Excel`)
        } else {
          notify('Gagal membaca file: ' + data.message, 'error')
        }
      } else {
        notify('Terjadi kesalahan saat membaca file', 'error')
      }
    } catch (error) {
      console.error('Error:', error)
      notify('Terjadi kesalahan saat memproses file', 'error')
    } finally {
      setImportLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleFileUpload(file)
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  // Fungsi untuk mengkonfirmasi import
  const confirmImport = async () => {
    if (!excelFile || previewData.length === 0) {
      notify('Silahkan upload file Excel terlebih dahulu', 'error')
      return
    }

    try {
      setImportLoading(true)

      // Konversi preview data ke format SoalItem
      const soalItems: SoalItem[] = previewData.map((soal, index) => ({
        id: soal.id || Math.floor(Math.random() * 1000) + 1000,
        soal: soal.soal,
        A: soal.jawaban.A.text,
        B: soal.jawaban.B.text,
        C: soal.jawaban.C.text,
        D: soal.jawaban.D.text,
        E: soal.jawaban.E.text,
        kunci: soal.kunci as 'A' | 'B' | 'C' | 'D' | 'E',
        syncStatus: 'unsaved' as const,
        tempId: `import-${Date.now()}-${index}`,
      }))

      // Tambahkan ke state soals
      const updatedSoals = [...soals, ...soalItems]
      setSoals(updatedSoals)

      // Simpan ke server
      await saveToServer(updatedSoals)

      notify(`Berhasil mengimpor ${soalItems.length} soal dari Excel`, 'success')
      setShowImportModal(false)
      resetImportForm()
    } catch (error) {
      console.error('Error importing:', error)
      notify('Gagal mengimpor soal dari Excel', 'error')
    } finally {
      setImportLoading(false)
    }
  }

  const resetImportForm = () => {
    setExcelFile(null)
    setPreviewData([])
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const formatHTMLPreview = (html: string) => {
    return { __html: html }
  }

  // ========== FUNGSI LAINNYA (SAMA) ==========
  const startEditSoal = (soal: SoalItem, index: number) => {
    setEditingSoal({ ...soal, tempId: `edit-${index}` })
    setQuickSoal({
      id: soal.id,
      soal: soal.soal,
      A: soal.A,
      B: soal.B,
      C: soal.C,
      D: soal.D,
      E: soal.E,
      kunci: soal.kunci,
    })
  }

  const cancelEdit = () => {
    setEditingSoal(null)
    setQuickSoal({
      id: '',
      soal: '',
      A: '',
      B: '',
      C: '',
      D: '',
      E: '',
      kunci: 'A',
    })
  }

  const saveToServer = async (soalContent: SoalItem[]) => {
    try {
      const contentToSave = soalContent.map((soal) => ({
        id: soal.id || Math.floor(Math.random() * 1001),
        soal: soal.soal,
        A: soal.A,
        B: soal.B,
        C: soal.C,
        D: soal.D,
        E: soal.E,
        kunci: soal.kunci,
      }))

      if (isOnline) {
        await router.put(
          `${url}/${bankSoal.id}/update-soal`,
          {
            soalContent: contentToSave,
          },
          {
            preserveScroll: true,
          }
        )
      }

      if (!isOnline && isStorageSupported) {
        const pendingData = await offlineStorage.getPendingSoal()

        const soalRecords: SoalItem[] = contentToSave.map((item: SoalItem) => ({
          id: item.id || Math.floor(Math.random() * 1001),
          soal: item.soal,
          A: item.A,
          B: item.B,
          C: item.C,
          D: item.D,
          E: item.E,
          kunci: item.kunci,
        }))

        const newRecords = soalRecords.filter(
          (newRecord) =>
            !pendingData.some(
              (pending) =>
                pending.A === newRecord.A &&
                pending.B === newRecord.B &&
                pending.C === newRecord.C &&
                pending.D === newRecord.D &&
                pending.E === newRecord.E &&
                pending.kunci === newRecord.kunci
            )
        )

        if (newRecords.length === 0) {
          notify('Semua data yang akan disimpan sudah ada dalam antrian offline.')

          return
        }

        await offlineStorage.clearSyncedData('all')

        await offlineStorage.saveSoal(soalRecords)
        const newPendingCount = pendingCount + soalRecords?.length
        setPendingCount(newPendingCount)

        notify(
          `Data absensi berhasil disimpan secara offline (${soalRecords?.length} record). Data akan disinkronisasi otomatis saat online.`
        )
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    if (isOnline && isStorageSupported && pendingCount > 0) {
      syncPendingData()
    }
  }, [isOnline, isStorageSupported, pendingCount])

  const syncPendingData = async () => {
    try {
      setSyncStatus('syncing')
      const pendingData = await offlineStorage.getPendingSoal()

      if (pendingData?.length > 0) {
        await saveToServer(pendingData)
        const ids = pendingData
          .map((item) => item.id)
          .filter((id): id is number => id !== undefined)
        await offlineStorage.markAsSynced(ids)

        setPendingCount(0)
        setSyncStatus('success')
        setTimeout(() => setSyncStatus('idle'), 3000)
        setTimeout(() => {
          offlineStorage.clearSyncedData('synced').catch(console.error)
        }, 5000)
      } else {
        setPendingCount(0)
        setSyncStatus('idle')
      }
    } catch (error) {
      console.error('Gagal sinkronisasi data:', error)
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  const handleTambahSoal = async () => {
    if (
      !quickSoal.soal ||
      !quickSoal.A ||
      !quickSoal.B ||
      !quickSoal.C ||
      !quickSoal.D ||
      !quickSoal.E
    ) {
      notify('Harap lengkapi semua field soal dan opsi jawaban')
      return
    }

    const newSoal: SoalItem = {
      ...quickSoal,
      id: quickSoal.id ?? Math.floor(Math.random() * 1001),
      tempId: `new-${Date.now()}`,
      syncStatus: 'unsaved' as const,
    }

    const updatedSoals = [...(soals || []), newSoal]

    try {
      setIsSubmitting(true)

      // Simpan langsung ke server
      await saveToServer(updatedSoals)
      notify('Soal berhasil ditambahkan dan disimpan ke server.')

      // Reset form
      setQuickSoal({
        id: '',
        soal: '',
        A: '',
        B: '',
        C: '',
        D: '',
        E: '',
        kunci: 'A',
      })
    } catch (error) {
      console.error('Gagal menambah soal:', error)
      notify('Gagal menambah soal. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEditSoal = async () => {
    if (!editingSoal) return

    if (
      !quickSoal.soal ||
      !quickSoal.A ||
      !quickSoal.B ||
      !quickSoal.C ||
      !quickSoal.D ||
      !quickSoal.E
    ) {
      notify('Harap lengkapi semua field soal dan opsi jawaban')
      return
    }

    // Cari index soal yang sedang diedit
    const index = soals?.findIndex(
      (s) => s.tempId === editingSoal.tempId || s.id === editingSoal.id
    )

    if (index !== -1) {
      const updatedSoals = [...(soals || [])]
      updatedSoals[index] = {
        ...updatedSoals[index],
        ...quickSoal,
        syncStatus: 'unsaved' as const,
      }

      try {
        setIsSubmitting(true)

        // Simpan langsung ke server
        await saveToServer(updatedSoals)
        notify('Soal berhasil diubah dan disimpan ke server.')

        cancelEdit()
      } catch (error) {
        console.error('Gagal mengedit soal:', error)
        notify('Gagal mengedit soal. Silakan coba lagi.')
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const removeSoal = async (index: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus soal ini?')) return

    const soalToRemove = soals?.[index]
    if (!soalToRemove?.id) {
      notify('ID soal tidak ditemukan untuk index:' + String(index))
      return
    }

    const updatedSoals = soals?.filter((_, i) => i !== index) || []

    try {
      setIsSubmitting(true)

      await offlineStorage.clearById(soalToRemove?.id)
      await saveToServer(updatedSoals)
      notify('Soal berhasil dihapus dari server.')
    } catch (error) {
      console.error('Gagal menghapus soal:', error)
      notify('Gagal menghapus soal. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const moveSoal = async (index: number, direction: 'up' | 'down') => {
    const updatedSoals = [...(soals || [])]

    if (direction === 'up' && index > 0) {
      ;[updatedSoals[index], updatedSoals[index - 1]] = [
        updatedSoals[index - 1],
        updatedSoals[index],
      ]
    } else if (direction === 'down' && index < updatedSoals.length - 1) {
      ;[updatedSoals[index], updatedSoals[index + 1]] = [
        updatedSoals[index + 1],
        updatedSoals[index],
      ]
    } else {
      return
    }

    try {
      setIsSubmitting(true)

      // Simpan langsung ke server
      await saveToServer(updatedSoals)
    } catch (error) {
      console.error('Gagal memindahkan soal:', error)
      notify('Gagal memindahkan soal. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto lg:p-6">
      <Notification />

      {/* Header dengan Status */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Soal: {bankSoal.namaUjian}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {bankSoal.jenisUjian} | Kelas {bankSoal.jenjang}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Status Online/Offline */}
          {syncStatus === 'syncing' && (
            <span className="text-purple-600 animate-pulse">Menyinkronisasi...</span>
          )}
          {syncStatus === 'success' && (
            <span className="text-green-600">✓ Berhasil disinkronisasi</span>
          )}
          {syncStatus === 'error' && <span className="text-red-600">✗ Gagal sinkronisasi</span>}
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              isOnline ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {isOnline ? 'Online' : 'Offline'}
          </div>

          {/* Tombol Import Excel */}
          <button
            onClick={() => setShowImportModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            <span>Import Excel</span>
          </button>

          <Link
            href={url}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Kembali
          </Link>
          {props.user.role != 'Guru' ? (
            <Link
              href={`${url}/${bankSoal.id}/selected-soal`}
              className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
            >
              Select Soal
            </Link>
          ) : null}
        </div>
      </div>

      {/* Modal Import Excel */}
      {showImportModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Import Soal dari Excel
              </h3>
              <button
                onClick={() => {
                  setShowImportModal(false)
                  resetImportForm()
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload File Excel
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                    excelFile
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  {importLoading ? (
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                      <p className="text-gray-600 dark:text-gray-400">Memproses file...</p>
                    </div>
                  ) : excelFile ? (
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-green-500 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                        {excelFile.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {previewData.length} soal berhasil dibaca
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setExcelFile(null)
                          setPreviewData([])
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Hapus file
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <svg
                        className="w-12 h-12 text-gray-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">
                        Klik untuk upload atau drop file Excel di sini
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Format .xlsx atau .xls (Maks. 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Preview Soal */}
              {previewData.length > 0 && (
                <>
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        Preview Soal ({previewData.length} soal)
                      </h4>
                      <span className="text-sm text-gray-500">
                        Kunci jawaban ditandai dengan <span className="text-green-600">✓</span>
                      </span>
                    </div>

                    <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              No
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Soal
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                              Jawaban Benar
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {previewData.map((soal, index) => (
                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs">
                                <div
                                  className="line-clamp-3 prose prose-sm max-w-none dark:prose-invert"
                                  dangerouslySetInnerHTML={formatHTMLPreview(soal.soal)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <div className="space-y-1">
                                  {Object.entries(soal.jawaban).map(
                                    ([key, jawaban]) =>
                                      jawaban.isCorrect &&
                                      jawaban.text !== '-' && (
                                        <div
                                          key={key}
                                          className="flex items-center p-2 rounded bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800"
                                        >
                                          <span className="font-medium mr-2 dark:text-white">
                                            {key}.
                                          </span>
                                          <div
                                            className="flex-1 dark:text-white prose prose-sm max-w-none dark:prose-invert line-clamp-2"
                                            dangerouslySetInnerHTML={formatHTMLPreview(
                                              jawaban.text
                                            )}
                                          />
                                          <span className="ml-2 text-green-600">✓</span>
                                        </div>
                                      )
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      onClick={() => {
                        setShowImportModal(false)
                        resetImportForm()
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                      disabled={importLoading}
                    >
                      Batal
                    </button>
                    <button
                      onClick={confirmImport}
                      disabled={importLoading}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                      {importLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          <span>Mengimpor...</span>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          <span>Import {previewData.length} Soal</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Input Cepat di Atas (Fixed) - Untuk Edit dan Tambah Soal */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6 top-4 z-10 border-2 border-purple-200">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {editingSoal ? '✏️ Edit Soal' : '➕ Tambah Soal Baru'}
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {/* Input Soal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pertanyaan
            </label>
            <UniversalInput
              name="soal"
              type="richtext"
              value={quickSoal.soal}
              onChange={(e) => setQuickSoal((prev) => ({ ...prev, soal: e }))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              placeholder="Tulis soal disini..."
            />
          </div>

          {/* Opsi Jawaban */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {['A', 'B', 'C', 'D', 'E'].map((opsi) => (
              <div key={opsi}>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Opsi {opsi}
                </label>
                <UniversalInput
                  name="soal"
                  type="richtext"
                  value={quickSoal[opsi as keyof typeof quickSoal] as string}
                  onChange={(e) => setQuickSoal((prev) => ({ ...prev, [opsi]: e }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  placeholder={`Jawaban ${opsi}...`}
                />
              </div>
            ))}
          </div>

          {/* Kunci Jawaban dan Tombol */}
          <div className="flex justify-between items-center">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Kunci Jawaban
              </label>
              <select
                onChange={(e) =>
                  setQuickSoal((prev) => ({ ...prev, kunci: e.target.value as any }))
                }
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                {['A', 'B', 'C', 'D', 'E'].map((opsi) => (
                  <option key={opsi} selected={opsi == quickSoal.kunci} value={opsi}>
                    Opsi {opsi}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex space-x-3">
              {editingSoal && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Batal Edit
                </button>
              )}
              <button
                type="button"
                onClick={editingSoal ? handleEditSoal : handleTambahSoal}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Menyimpan...</span>
                  </>
                ) : editingSoal ? (
                  <span>Simpan Perubahan</span>
                ) : (
                  <span>Tambah Soal</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Soal (Hanya Teks) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Daftar Soal ({soals?.length || 0} soal)
          </h2>
        </div>

        {soals?.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Belum ada soal. Gunakan form di atas untuk menambahkan soal pertama atau import dari
            Excel.
          </div>
        ) : (
          <div className="space-y-3">
            {soals?.map((soal, index) => (
              <SoalListItem
                key={soal.tempId || soal.id || index}
                soal={soal}
                index={index}
                onEdit={() => startEditSoal(soal, index)}
                onRemove={() => removeSoal(index)}
                onMove={moveSoal}
                canMoveUp={index > 0}
                canMoveDown={index < (soals?.length || 0) - 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Komponen List Item untuk setiap soal (hanya teks)
interface SoalListItemProps {
  soal: SoalItem
  index: number
  onEdit: () => void
  onRemove: () => void
  onMove: (index: number, direction: 'up' | 'down') => void
  canMoveUp: boolean
  canMoveDown: boolean
}

function SoalListItem({
  soal,
  index,
  onEdit,
  onRemove,
  onMove,
  canMoveUp,
  canMoveDown,
}: SoalListItemProps) {
  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'synced':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'unsaved':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'synced':
        return 'Tersimpan'
      case 'unsaved':
        return 'Belum Tersimpan'
      default:
        return status
    }
  }

  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center flex-1">
        <div className="flex items-center">
          <button
            type="button"
            title="Pindah Keatas"
            onClick={() => onMove(index, 'up')}
            disabled={!canMoveUp}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
          >
            ↑
          </button>
          <button
            type="button"
            title="Pindah Kebawah"
            onClick={() => onMove(index, 'down')}
            disabled={!canMoveDown}
            className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
          >
            ↓
          </button>
        </div>

        <div className="flex">
          <div className="flex-shrink-0 w-8 text-center font-medium text-gray-500">
            {index + 1}.
          </div>
          <div>
            <div
              className="text-gray-900 dark:text-white line-clamp-2"
              dangerouslySetInnerHTML={{ __html: soal.soal }}
            ></div>
            <div className="text-gray-900 dark:text-white flex flex-col gap-2 mt-4">
              <span className="flex flex-wrap">
                A. <span dangerouslySetInnerHTML={{ __html: soal.A }}></span>
              </span>
              <span className="flex flex-wrap">
                B. <span dangerouslySetInnerHTML={{ __html: soal.B }}></span>
              </span>
              <span className="flex flex-wrap">
                C. <span dangerouslySetInnerHTML={{ __html: soal.C }}></span>
              </span>
              <span className="flex flex-wrap">
                D. <span dangerouslySetInnerHTML={{ __html: soal.D }}></span>
              </span>
              <span className="flex flex-wrap">
                E. <span dangerouslySetInnerHTML={{ __html: soal.E }}></span>
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Kunci: <span className="font-medium">{soal.kunci}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(soal.syncStatus)}`}
        >
          {getStatusText(soal.syncStatus)}
        </span>

        <button
          type="button"
          onClick={onEdit}
          className="px-3 py-1 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-sm"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 text-sm"
        >
          Hapus
        </button>
      </div>
    </div>
  )
}

EditSoal.layout = (page: any) => {
  const activeRole = page.props.activeRole ?? page.props.user.role
  if (activeRole == 'Guru') {
    return <GuruLayout>{page}</GuruLayout>
  }
  if (activeRole == 'Staf') {
    return <StafLayout>{page}</StafLayout>
  }

  return <SuperAdminLayout>{page}</SuperAdminLayout>
}
