import { router } from '@inertiajs/react'
import { useState, useEffect } from 'react'
import UniversalInput from '~/Components/UniversalInput'
import GuruLayout from '~/Layouts/GuruLayouts'
import ExcelJS from 'exceljs'
import ReactDOMServer from 'react-dom/server'

interface Kelas {
  id: string
  namaKelas: string
  jenjang: string
}

interface SiswaData {
  calculated: {
    naFormatif: number
    naSumatif: number
    naSumatifFinal: number
    nilaiRaport: number
    ranking: number
  }
  nama: string
  nilai: number
  nisn: string
  structure: {
    formatif: number[]
    sumatif: number[]
    nonTES: number
    tes: number
    deskripsi: string
  }
}

interface metaData {
  metadata: {
    kelasName: string
    mapelName: string
    ujian: string
  }
  data: SiswaData[]
  competence: string[]
}

interface DataNilai {
  dataKelas: Kelas[]
  tp_columns: string[]
  nip: string
}

interface EditedNilai {
  [nisn: string]: {
    formatif: number[]
    sumatif: number[]
    nilaiSTS?: number
    nonTES?: number
    tes?: number
    deskripsi?: string
  }
}

export default function PengelolaanNilai({ dataKelas, nip }: DataNilai) {
  const [selectedValue, setSelectedValue] = useState({
    kelas: '',
    mapel: '',
    ujian: '',
  })

  const [metaDataNilai, setMetaDataNilai] = useState<metaData | null>(null)
  const [editedNilai, setEditedNilai] = useState<EditedNilai>({})
  const [optionMapel, setOptionMapel] = useState([])
  const [optionUjian, setOptionUjian] = useState([])
  const [showCompetenceModal, setShowCompetenceModal] = useState(false)
  const [newCompetence, setNewCompetence] = useState('')
  const [competenceList, setCompetenceList] = useState<string[]>([])

  const optionKelas = dataKelas.map((item: any) => ({
    label: item.namaKelas,
    value: item.id,
  }))

  // Initialize editedNilai when metaDataNilai changes
  useEffect(() => {
    if (metaDataNilai?.data) {
      const initialEditedNilai: EditedNilai = {}
      metaDataNilai.data.forEach((siswa) => {
        initialEditedNilai[siswa.nisn] = {
          formatif: [...siswa.structure.formatif],
          sumatif: [...siswa.structure.sumatif],
          tes: siswa.structure.tes,
          nonTES: siswa.structure.nonTES,
          deskripsi: siswa.structure.deskripsi,
        }
      })
      setEditedNilai(initialEditedNilai)
    }
  }, [metaDataNilai])

  // Initialize competence list when metaDataNilai changes
  useEffect(() => {
    if (metaDataNilai?.competence) {
      setCompetenceList(metaDataNilai.competence)
    }
  }, [metaDataNilai])

  const getMapel = async (kelas: any) => {
    const idMapel = kelas.guruMapelMapping[nip]
    const response = await fetch(`/guru/pengelolaan-nilai/data/${idMapel}`)
    const data = await response.json()
    const convertDataMapel = data.map((item: any) => ({
      label: item.namaMataPelajaran,
      value: item.id,
    }))

    setOptionMapel(convertDataMapel)
  }

  const getUjian = async (jenjang: any, mapelId: any) => {
    const response = await fetch(`/guru/pengelolaan-nilai/dataUjian/${jenjang}/${mapelId}`)
    const data = await response.json()
    const convestDataUjian = data.map((item: any) => ({
      label: item.namaUjian,
      value: item.id,
    }))

    setOptionUjian(convestDataUjian)
  }

  const getNilai = async (ujian: any) => {
    const response = await fetch(
      `/guru/pengelolaan-nilai/dataNilai/${selectedValue.kelas}/${selectedValue.mapel}/${ujian}`
    )
    const data = await response.json()

    setMetaDataNilai(data)
  }

  const handleNilaiChange = (
    nisn: string,
    type: 'formatif' | 'sumatif' | 'nilaiSTS' | 'nonTES' | 'tes' | 'deskripsi',
    index: number | null,
    value: string
  ) => {
    setEditedNilai((prev) => {
      const currentSiswa = prev[nisn] || { formatif: [], sumatif: [] }

      if (type === 'formatif' || type === 'sumatif') {
        if (index !== null) {
          const newArray = [...currentSiswa[type]]
          newArray[index] = value === '' ? 0 : Number(value)
          return {
            ...prev,
            [nisn]: {
              ...currentSiswa,
              [type]: newArray,
            },
          }
        }
      } else {
        return {
          ...prev,
          [nisn]: {
            ...currentSiswa,
            [type]: value,
          },
        }
      }

      return prev
    })
  }

  const addColumn = (type: 'formatif' | 'sumatif') => {
    setEditedNilai((prev) => {
      const newEditedNilai = { ...prev }

      Object.keys(newEditedNilai).forEach((nisn) => {
        const currentSiswa = newEditedNilai[nisn]
        const newArray = [...(currentSiswa[type] || []), 0]

        newEditedNilai[nisn] = {
          ...currentSiswa,
          [type]: newArray,
        }
      })

      return newEditedNilai
    })
  }

  const deleteColumn = (type: 'formatif' | 'sumatif', index: number) => {
    setEditedNilai((prev) => {
      const newEditedNilai = { ...prev }

      Object.keys(newEditedNilai).forEach((nisn) => {
        const currentSiswa = newEditedNilai[nisn]
        if (currentSiswa[type] && currentSiswa[type].length > index) {
          const newArray = [...currentSiswa[type]]
          newArray.splice(index, 1)
          newEditedNilai[nisn] = {
            ...currentSiswa,
            [type]: newArray,
          }
        }
      })

      return newEditedNilai
    })
  }

  const calculateNA = (nilaiArray: number[]): number => {
    if (nilaiArray.length === 0) return 0
    const sum = nilaiArray.reduce((acc, curr) => acc + curr, 0)
    return sum / nilaiArray.length
  }

  const saveChanges = async () => {
    try {
      const newData = metaDataNilai?.data.map((item) => {
        const siswaNilai = editedNilai[item.nisn]
        const formatifNilai = siswaNilai?.formatif || item.structure.formatif
        const sumatifNilai = siswaNilai?.sumatif || item.structure.sumatif
        const nilaiSTS = siswaNilai?.nilaiSTS !== undefined ? siswaNilai.nilaiSTS : item.nilai
        const naFormatif = calculateNA(formatifNilai)
        const naSumatif = calculateNA(sumatifNilai)
        const deskripsi = siswaNilai?.deskripsi || ''
        const siswaDenganTotal = metaDataNilai.data.map((siswa) => {
          const formatif = editedNilai[siswa.nisn]?.formatif || siswa.structure.formatif
          const sumatif = editedNilai[siswa.nisn]?.sumatif || siswa.structure.sumatif
          const sumFormatif = formatif.reduce((a, b) => a + b, 0)
          const sumSumatif = sumatif.reduce((a, b) => a + b, 0)
          const totalNilai = (sumFormatif + sumSumatif) / siswa.nilai
          return { ...siswa, totalNilai }
        })
        const siswaTerurut = [...siswaDenganTotal].sort((a, b) => b.totalNilai - a.totalNilai)

        const rankingMap = {} as any
        siswaTerurut.forEach((s, i) => {
          rankingMap[s.nisn] = i + 1
        })
        return {
          nisn: item.nisn,
          nama: item.nama,
          nilai: item.nilai,
          calculated: {
            naFormatif: naFormatif.toFixed(0),
            naSumatif: naSumatif.toFixed(0),
            naSumatifFinal: nilaiSTS,
            nilaiRaport: ((naFormatif + naSumatif + nilaiSTS) / 3).toFixed(0),
            ranking: rankingMap[item.nisn],
          },
          structure: {
            formatif: formatifNilai,
            sumatif: sumatifNilai,
            nonTES: siswaNilai?.nonTES,
            tes: siswaNilai?.tes,
            deskripsi: deskripsi,
          },
        }
      })

      router.post(
        `/guru/pengelolaan-nilai/save/${selectedValue.mapel}/${selectedValue.kelas}/${selectedValue.ujian}`,
        {
          payload: {
            metadata: {
              mapelName: metaDataNilai?.metadata.mapelName,
              kelasName: metaDataNilai?.metadata.kelasName,
              ujian: metaDataNilai?.metadata.ujian,
            },
            competence: competenceList,
            data: newData,
          },
        }
      )
    } catch (error) {
      console.error('Error saving changes:', error)
      alert('Terjadi kesalahan saat menyimpan')
    }
  }

  const addCompetence = () => {
    if (newCompetence.trim() !== '') {
      setCompetenceList((prev) => [...prev, newCompetence.trim()])
      setNewCompetence('')
      setShowCompetenceModal(false)
    }
  }

  const deleteCompetence = (index: number) => {
    setCompetenceList((prev) => prev.filter((_, i) => i !== index))
  }

  const exportToExcel = async () => {
    if (!metaDataNilai) return alert('Data belum dimuat')

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Rekap Nilai')

    // Data preparation
    const maxFormatifColumns = metaDataNilai.data.reduce(
      (max, siswa) => Math.max(max, siswa.structure.formatif.length),
      0
    )

    const maxSumatifColumns = metaDataNilai.data.reduce(
      (max, siswa) => Math.max(max, siswa.structure.sumatif.length),
      0
    )

    // TAMBAHKAN COMPETENCE ROW DI ATAS HEADER1
    if (metaDataNilai.competence && metaDataNilai.competence.length > 0) {
      // Buat array untuk competence row
      const competenceRow = ['Capaian Kompetensi:']

      // Tambahkan setiap competence dengan empty string untuk kolom kedua
      metaDataNilai.competence.forEach((competence) => {
        competenceRow.push(competence, '') // Setiap competence dapat 2 kolom
      })

      // Tambah competence row (ROW 1)
      worksheet.addRow(competenceRow)
    }

    // Header level 1 (SEKARANG ROW 2)
    const header1 = [
      'No',
      'NISN',
      'Nama',
      ...Array(maxFormatifColumns + 1).fill('Formatif'),
      ...Array(maxSumatifColumns + 1).fill('Sumatif'),
      'Nilai STS',
      ...Array(3).fill('Sumatif Akhir Semester'),
      'Nilai Raport',
      'Ranking',
      'Capaian Kompetensi (Deskripsi)',
    ]

    // Header level 2 (SEKARANG ROW 3)
    const header2 = [
      '',
      '',
      '',
      ...Array.from({ length: maxFormatifColumns }, (_, i) => `TP-${i + 1}`),
      'NA Formatif',
      ...Array.from({ length: maxSumatifColumns }, (_, i) => `SUM-${i + 1}`),
      'NA Sumatif',
      '',
      'Non-TES',
      'TES',
      'NA Sumatif Akhir',
      '',
      '',
      '',
    ]

    // Add headers (SEKARANG ROW 2 & 3)
    worksheet.addRow(header1)
    worksheet.addRow(header2)

    // Add data (MULAI DARI ROW 4)
    metaDataNilai.data.forEach((item, index) => {
      const formatif = item.structure.formatif || []
      const sumatif = item.structure.sumatif || []

      const row = [
        index + 1,
        item.nisn,
        item.nama,
        ...formatif,
        item.calculated.naFormatif,
        ...sumatif,
        item.calculated.naSumatif,
        item.nilai,
        item.structure.nonTES,
        item.structure.tes,
        item.calculated.naSumatifFinal,
        item.calculated.nilaiRaport,
        item.calculated.ranking,
        item.structure.deskripsi || '-',
      ]
      worksheet.addRow(row)
    })

    // HITUNG OFFSET ROW KARENA ADA COMPETENCE
    const hasCompetence = metaDataNilai.competence && metaDataNilai.competence.length > 0
    const rowOffset = hasCompetence ? 1 : 0

    const header1Row = 1 + rowOffset // Row 2 jika ada competence, row 1 jika tidak
    const header2Row = 2 + rowOffset // Row 3 jika ada competence, row 2 jika tidak
    const dataStartRow = 3 + rowOffset // Row 4 jika ada competence, row 3 jika tidak

    // MERGE CELLS - SESUAIKAN DENGAN ROW OFFSET
    // Formatif header
    if (maxFormatifColumns > 0) {
      worksheet.mergeCells(header1Row, 4, header1Row, 4 + maxFormatifColumns)
    }

    // Sumatif header
    const startSumatifCol = 4 + maxFormatifColumns + 1
    if (maxSumatifColumns > 0) {
      worksheet.mergeCells(
        header1Row,
        startSumatifCol,
        header1Row,
        startSumatifCol + maxSumatifColumns
      )
    }

    // Nilai STS
    const stsCol = startSumatifCol + maxSumatifColumns + 1
    worksheet.mergeCells(header1Row, stsCol, header2Row, stsCol)

    // Sumatif Akhir Semester
    const sasStartCol = stsCol + 1
    worksheet.mergeCells(header1Row, sasStartCol, header1Row, sasStartCol + 2)

    // Nilai Raport, Ranking, Deskripsi
    worksheet.mergeCells(header1Row, sasStartCol + 3, header2Row, sasStartCol + 3)
    worksheet.mergeCells(header1Row, sasStartCol + 4, header2Row, sasStartCol + 4)
    worksheet.mergeCells(header1Row, sasStartCol + 5, header2Row, sasStartCol + 5)

    // No, NISN, Nama
    worksheet.mergeCells(header1Row, 1, header2Row, 1)
    worksheet.mergeCells(header1Row, 2, header2Row, 2)
    worksheet.mergeCells(header1Row, 3, header2Row, 3)

    // MERGE CELLS UNTUK COMPETENCE (JIKA ADA)
    if (hasCompetence) {
      let currentCol = 2 // Mulai dari kolom 2 (setelah "Capaian Kompetensi")
      metaDataNilai.competence.forEach((_, index) => {
        worksheet.mergeCells(1, currentCol, 1, currentCol + 1) // Row 1 untuk competence
        currentCol += 2 // Pindah ke competence berikutnya (loncat 2 kolom)
      })

      // Merge cell untuk label "Capaian Kompetensi"
      worksheet.mergeCells(1, 1, 1, 1) // Tetap 1 kolom untuk label
    }

    // STYLING YANG BENAR DENGAN ROW OFFSET
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        // Base style untuk semua cell
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        }
        cell.font = {
          name: 'Arial',
          size: 10,
        }
        cell.alignment = {
          vertical: 'middle',
          horizontal: 'center',
          wrapText: true,
        }

        // Competence row styling (ROW 1 - hanya jika ada competence)
        if (hasCompetence && rowNumber === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE5E7EB' }, // Abu-abu muda
          }
          cell.font = {
            ...cell.font,
            color: { argb: 'FF000000' },
          }
          cell.alignment = {
            vertical: 'middle',
            wrapText: true,
          }
        }

        // Header 1 styling (ROW 2 jika ada competence, ROW 1 jika tidak)
        if (rowNumber === header1Row) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF6B35' }, // Orange
          }
          cell.font = {
            ...cell.font,
            bold: true,
            color: { argb: 'FFFFFFFF' },
          }
        }

        // Header 2 styling (ROW 3 jika ada competence, ROW 2 jika tidak)
        if (rowNumber === header2Row) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF59E' }, // Kuning
          }
          cell.font = {
            ...cell.font,
            bold: true,
            color: { argb: 'FF000000' },
          }
        }

        // Data rows (ROW 4 dan seterusnya jika ada competence, ROW 3 dan seterusnya jika tidak)
        if (rowNumber >= dataStartRow) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFFFFF' }, // Putih
          }
        }
      })
    })

    // Column widths
    const columns = [
      { key: 'A', width: 8 }, // No
      { key: 'B', width: 12 }, // NISN
      { key: 'C', width: 25 }, // Nama
    ]

    // Formatif columns
    for (let i = 0; i < maxFormatifColumns + 1; i++) {
      columns.push({ key: String.fromCharCode(68 + i), width: 10 })
    }

    // Sumatif columns
    for (let i = 0; i < maxSumatifColumns + 1; i++) {
      columns.push({ key: String.fromCharCode(68 + maxFormatifColumns + 1 + i), width: 10 })
    }

    // Sisanya
    const remainingColumns = [
      { key: String.fromCharCode(68 + maxFormatifColumns + maxSumatifColumns + 2), width: 12 }, // STS
      { key: String.fromCharCode(68 + maxFormatifColumns + maxSumatifColumns + 3), width: 12 }, // Non-TES
      { key: String.fromCharCode(68 + maxFormatifColumns + maxSumatifColumns + 4), width: 12 }, // TES
      { key: String.fromCharCode(68 + maxFormatifColumns + maxSumatifColumns + 5), width: 15 }, // NA Sumatif Akhir
      { key: String.fromCharCode(68 + maxFormatifColumns + maxSumatifColumns + 6), width: 15 }, // Nilai Raport
      { key: String.fromCharCode(68 + maxFormatifColumns + maxSumatifColumns + 7), width: 10 }, // Ranking
      { key: String.fromCharCode(68 + maxFormatifColumns + maxSumatifColumns + 8), width: 40 }, // Deskripsi
    ]

    worksheet.columns = [...columns, ...remainingColumns]

    // Freeze panes (header tetap visible) - sesuaikan dengan offset
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: dataStartRow - 1 }, // Freeze di atas data rows
    ]

    // Save file
    try {
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Rekap_Nilai_${metaDataNilai.metadata.kelasName}_${metaDataNilai.metadata.mapelName}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting Excel:', error)
      alert('Error saat mengexport file Excel')
    }
  }

  const handlePrint = () => {
    // buka jendela baru untuk print
    const newWindow = window.open('', '_blank')

    const tabel = (
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-orange-600 ">
          <tr>
            <th
              rowSpan={2}
              className="px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
            >
              No
            </th>
            <th
              rowSpan={2}
              className="px-4 py-1 min-w-[150px] text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
            >
              NISN
            </th>
            <th
              rowSpan={2}
              className="px-4 py-1 min-w-[250px] text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
            >
              Nama
            </th>

            {/* Formatif Header */}
            <th
              colSpan={maxFormatifColumns + 1}
              className="formatifClm bg-sky-600 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
            >
              Formatif
            </th>

            {/* Sumatif Header */}
            <th
              colSpan={maxSumatifColumns + 1}
              className="sumatifClm bg-green-500 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
            >
              Sumatif
            </th>

            <th
              rowSpan={2}
              className="bg-yellow-500 text-red-700 px-4 py-1 text-nowrap text-left text-xs font-bold uppercase tracking-wider"
            >
              Nilai STS
            </th>

            <th
              colSpan={3}
              className="bg-sky-600 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
            >
              Sumatif Akhir Semester
            </th>

            <th
              rowSpan={2}
              className="bg-purple-600 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
            >
              Nilai Rapot
            </th>
            <th
              rowSpan={2}
              className="bg-pink-400 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
            >
              Ranking
            </th>
            <th
              rowSpan={2}
              className="px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
            >
              Capaian Kompetensi
            </th>
          </tr>
          <tr>
            {/* Formatif Subheaders */}
            {Array.from({ length: maxFormatifColumns }).map((_, index) => (
              <th
                key={`formatif-${index}`}
                className="bg-red-400 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200 relative group"
              >
                TP-{index + 1}
              </th>
            ))}

            <th className="bg-emerald-700 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200">
              NA Formatif
            </th>

            {/* Sumatif Subheaders */}
            {Array.from({ length: maxSumatifColumns }).map((_, index) => (
              <th
                key={`sumatif-${index}`}
                className="bg-red-400 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200 relative group"
              >
                SUM-{index + 1}
              </th>
            ))}

            <th className="bg-emerald-700 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200">
              NA Sumatif
            </th>

            {/* Sumatif Akhir Semester */}
            <th className="px-4 py-1 min-w-[90px] text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200">
              Non-TES
            </th>
            <th className="px-4 min-w-[90px] py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200">
              TES
            </th>
            <th className="bg-emerald-700 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200">
              NA Sumatif Akhir Semester
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 bg-white ">
          {metaDataNilai?.data.map((item, index) => {
            const siswaNilai = editedNilai[item.nisn]
            const formatifNilai = siswaNilai?.formatif || item.structure.formatif
            const sumatifNilai = siswaNilai?.sumatif || item.structure.sumatif
            const nilaiSTS = siswaNilai?.nilaiSTS !== undefined ? siswaNilai.nilaiSTS : item.nilai
            const naFormatif = calculateNA(formatifNilai)
            const naSumatif = calculateNA(sumatifNilai)
            const NilaiRaport = (naFormatif + naSumatif + nilaiSTS) / 3
            const deskripsi = siswaNilai?.deskripsi || ''

            const siswaDenganTotal = metaDataNilai.data.map((siswa) => {
              const formatif = editedNilai[siswa.nisn]?.formatif || siswa.structure.formatif
              const sumatif = editedNilai[siswa.nisn]?.sumatif || siswa.structure.sumatif
              const sumFormatif = formatif.reduce((a, b) => a + b, 0)
              const sumSumatif = sumatif.reduce((a, b) => a + b, 0)
              const totalNilai = (sumFormatif + sumSumatif) / siswa.nilai
              return { ...siswa, totalNilai }
            })
            const siswaTerurut = [...siswaDenganTotal].sort((a, b) => b.totalNilai - a.totalNilai)

            const rankingMap = {} as any
            siswaTerurut.forEach((s, i) => {
              rankingMap[s.nisn] = i + 1
            })

            return (
              <tr key={item.nisn} className="hover:bg-gray-50 ">
                <td className="px-4 py-4 text-center text-gray-500 ">{index + 1}</td>
                <td className="px-4 py-4 text-center text-gray-500 ">{item.nisn}</td>
                <td className="px-4 py-4 text-gray-500 ">{item.nama}</td>

                {/* Formatif Cells */}
                {Array.from({ length: maxFormatifColumns }).map((_, colIndex) => (
                  <td key={`formatif-${item.nisn}-${colIndex}`} className="px-1 py-2 text-center">
                    {formatifNilai[colIndex] || ''}
                  </td>
                ))}
                {/* Empty cell for plus button */}
                <td className="px-4 py-4 text-center text-gray-500 font-medium">
                  {naFormatif.toFixed(0)}
                </td>

                {/* Sumatif Cells */}
                {Array.from({ length: maxSumatifColumns }).map((_, colIndex) => (
                  <td key={`sumatif-${item.nisn}-${colIndex}`} className="px-2 py-2 text-center">
                    {sumatifNilai[colIndex] || ''}
                  </td>
                ))}
                {/* Empty cell for plus button */}

                <td className="px-4 py-4 text-center text-gray-500 font-medium">
                  {naSumatif.toFixed(0)}
                </td>

                {/* Nilai STS */}
                <td className="px-4 py-4 text-center text-gray-500 font-medium">{nilaiSTS}</td>

                {/* Sumatif Akhir Semester */}
                <td className="px-2 py-2 text-center">{siswaNilai?.nonTES || ''}</td>
                <td className="px-2 py-2 text-center">{siswaNilai?.tes || ''}</td>
                <td className="px-4 py-4 text-center text-gray-500 font-medium">
                  {item.calculated.naSumatifFinal.toFixed(0)}
                </td>

                {/* Nilai Rapot & Ranking */}
                <td className="px-4 py-4 text-center text-gray-500 font-medium">
                  {NilaiRaport.toFixed(0)}
                </td>
                <td className="px-4 py-4 text-center text-gray-500 font-medium">
                  {rankingMap[item.nisn]}
                </td>
                <td className="px-4 py-4 text-center text-gray-500">{deskripsi}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    )

    const tabelHTML = ReactDOMServer.renderToString(tabel)
    newWindow?.document.write(`
    <html>
      <head>
        <title>Rekap Nilai - ${metaDataNilai?.metadata?.kelasName}</title>
        <style>
          @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
          body { font-family: 'Arial', sans-serif; margin: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 10pt;  }
          th, td { border: 1px solid #ccc; font-size: 12px !important; padding: 6px 8px; text-align: center; }
          td{font-size: 9px !important;}
          th { background-color: #f97316; color: #fff; }
          tr:nth-child(even) { background-color: #f9fafb; }
          h2 { text-align: center; margin-bottom: 20px; color: #374151; }
          
          @media print {
            @page {
              size: A4 landscape;
              margin: 10mm;
              @bottom-center {
                content: counter(page) " / " counter(pages);
                font-size: 10pt;
                color: #444;
              }
            }

            body {
            margin: 0;
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }

            th {
              background-color: #ea580c !important;
              color: #fff !important;
            }

             { background-color: #f472b6 !important; color: #fff !important; }
            .bg-sky-600 { background-color: #0284c7 !important; color: #fff !important; }
            .bg-green-500, bg-emerald-700  { background-color: #22c55e !important; color: #fff !important; }
            .bg-yellow-500 { background-color: #eab308 !important; color: #fff !important; }
            .bg-purple-600 { background-color: #9333ea !important; color: #fff !important; }
            .bg-pink-400, .bg-red-400 { background-color: #f472b6 !important; color: #fff !important; }
          }
        </style>
      </head>
      <body>
        <h2>
          Rekap Nilai<br>
          ${metaDataNilai?.metadata?.mapelName} - ${metaDataNilai?.metadata?.kelasName}
        </h2>
        ${tabelHTML}
      </body>
    </html>
  `)

    newWindow?.document.close()
    newWindow?.focus()
    newWindow?.print()
    newWindow?.close()
  }

  // Get max columns for formatting
  const maxFormatifColumns =
    metaDataNilai?.data.reduce((max, siswa) => {
      const currentCols =
        editedNilai[siswa.nisn]?.formatif?.length || siswa.structure.formatif.length
      return Math.max(max, currentCols)
    }, 0) || 0

  const maxSumatifColumns =
    metaDataNilai?.data.reduce((max, siswa) => {
      const currentCols = editedNilai[siswa.nisn]?.sumatif?.length || siswa.structure.sumatif.length
      return Math.max(max, currentCols)
    }, 0) || 0

  return (
    <div className="max-w-7xl mx-auto lg:p-6">
      <div className="grid grid-cols-3 gap-3 w-full mt-5">
        <UniversalInput
          name="PilihKelas"
          label="Pilih Kelas"
          type="select"
          options={optionKelas}
          value={selectedValue.kelas}
          onChange={(value) => {
            setSelectedValue((prev) => ({
              ...prev,
              kelas: value,
            }))

            const kelas = dataKelas.find((item) => item.id == value)
            getMapel(kelas)
          }}
        />

        <UniversalInput
          name="PilihMapel"
          label="Pilih Mapel"
          type="select"
          options={optionMapel}
          value={selectedValue.mapel}
          disabled={optionMapel.length == 0}
          onChange={(value) => {
            setSelectedValue((prev) => ({
              ...prev,
              mapel: value,
            }))

            const kelas = dataKelas.find((item) => item.id == selectedValue.kelas)

            getUjian(kelas?.jenjang, value)
          }}
        />

        <UniversalInput
          name="PilihUjian"
          label="Pilih Ujian"
          type="select"
          value={selectedValue.ujian}
          options={optionUjian}
          disabled={optionUjian.length == 0}
          onChange={(value) => {
            setSelectedValue((prev) => ({
              ...prev,
              ujian: value,
            }))

            getNilai(value)
          }}
        />
      </div>

      {/* Save Button */}
      {metaDataNilai && (
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setShowCompetenceModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Tambah Competence
          </button>
          <div className="flex gap-1 items-center">
            <button
              onClick={exportToExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Download Excell
            </button>
            <button
              onClick={handlePrint}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Print
            </button>
            <button
              onClick={saveChanges}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium"
            >
              Simpan Perubahan
            </button>
          </div>
        </div>
      )}

      {/* Competence Modal */}
      {showCompetenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-96">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Tambah Competence Baru
            </h3>
            <textarea
              value={newCompetence}
              onChange={(e) => setNewCompetence(e.target.value)}
              placeholder="Masukkan deskripsi competence..."
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCompetenceModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Batal
              </button>
              <button
                onClick={addCompetence}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
              >
                Tambah
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="tabel-nilai-print overflow-x-auto scrollbar-thin scrollbar-thumb-purple dark:scrollbar-thumb-dark mt-4">
        <div className="grid grid-cols-5">
          {competenceList.map((competence, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between text-xs py-1 px-2 bg-amber-500 dark:bg-amber-600"
            >
              <span className="flex-1">
                {competence.length > 100 ? competence.slice(0, 100) + '...' : competence}
              </span>
              <button
                onClick={() => deleteCompetence(idx)}
                className="ml-2 text-red-500 hover:text-red-700 text-xl"
                title="Hapus competence"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-orange-600 dark:bg-orange-700">
            <tr>
              <th
                rowSpan={2}
                className="px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
              >
                No
              </th>
              <th
                rowSpan={2}
                className="px-4 py-1 min-w-[150px] text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
              >
                NISN
              </th>
              <th
                rowSpan={2}
                className="px-4 py-1 min-w-[250px] text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
              >
                Nama
              </th>

              {/* Formatif Header */}
              <th
                colSpan={maxFormatifColumns + 2}
                className="formatifClm bg-sky-600 dark:bg-sky-800 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
              >
                Formatif
              </th>

              {/* Sumatif Header */}
              <th
                colSpan={maxSumatifColumns + 2}
                className="sumatifClm bg-green-500 dark:bg-green-600 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
              >
                Sumatif
              </th>

              <th
                rowSpan={2}
                className="bg-yellow-500 text-red-700 dark:bg-yellow-600 px-4 py-1 text-nowrap text-left text-xs font-bold uppercase tracking-wider"
              >
                Nilai STS
              </th>

              <th
                colSpan={3}
                className="bg-sky-600 dark:bg-sky-800 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
              >
                Sumatif Akhir Semester
              </th>

              <th
                rowSpan={2}
                className="bg-purple-600 dark:bg-purple-700 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
              >
                Nilai Rapot
              </th>
              <th
                rowSpan={2}
                className="bg-pink-400 dark:bg-pink-600 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
              >
                Ranking
              </th>
              <th
                rowSpan={2}
                className="px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200"
              >
                Capaian Kompetensi (Deskripsi)
              </th>
            </tr>
            <tr>
              {/* Formatif Subheaders */}
              {Array.from({ length: maxFormatifColumns }).map((_, index) => (
                <th
                  key={`formatif-${index}`}
                  className="bg-red-400 dark:bg-red-700 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200 relative group"
                >
                  TP-{index + 1}
                  {maxFormatifColumns > 1 && (
                    <button
                      onClick={() => deleteColumn('formatif', index)}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Hapus TP"
                    >
                      ×
                    </button>
                  )}
                </th>
              ))}
              <th
                className="clmadd cursor-pointer bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-700 dark:hover:bg-yellow-600 px-2 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-700 dark:text-yellow-400"
                onClick={() => addColumn('formatif')}
              >
                <i className="fa-solid fa-plus"></i>
              </th>
              <th className="bg-emerald-700 dark:bg-emerald-900 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200">
                NA Formatif
              </th>

              {/* Sumatif Subheaders */}
              {Array.from({ length: maxSumatifColumns }).map((_, index) => (
                <th
                  key={`sumatif-${index}`}
                  className="bg-red-400 dark:bg-red-700 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200 relative group"
                >
                  SUM-{index + 1}
                  {maxSumatifColumns > 1 && (
                    <button
                      onClick={() => deleteColumn('sumatif', index)}
                      className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Hapus SUM"
                    >
                      ×
                    </button>
                  )}
                </th>
              ))}
              <th
                className="clmadd cursor-pointer bg-yellow-400 hover:bg-yellow-500 dark:bg-yellow-700 dark:hover:bg-yellow-600 px-2 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-700 dark:text-yellow-400"
                onClick={() => addColumn('sumatif')}
              >
                <i className="fa-solid fa-plus"></i>
              </th>
              <th className="bg-emerald-700 dark:bg-emerald-900 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200">
                NA Sumatif
              </th>

              {/* Sumatif Akhir Semester */}
              <th className="px-4 py-1 min-w-[90px] text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200">
                Non-TES
              </th>
              <th className="px-4 min-w-[90px] py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200">
                TES
              </th>
              <th className="bg-emerald-700 dark:bg-emerald-900 px-4 py-1 text-nowrap text-left text-xs font-medium uppercase tracking-wider text-yellow-200">
                NA Sumatif Akhir Semester
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-900">
            {metaDataNilai?.data.map((item, index) => {
              const siswaNilai = editedNilai[item.nisn]
              const formatifNilai = siswaNilai?.formatif || item.structure.formatif
              const sumatifNilai = siswaNilai?.sumatif || item.structure.sumatif
              const nilaiSTS = siswaNilai?.nilaiSTS !== undefined ? siswaNilai.nilaiSTS : item.nilai
              const naFormatif = calculateNA(formatifNilai)
              const naSumatif = calculateNA(sumatifNilai)
              const NilaiRaport = (naFormatif + naSumatif + nilaiSTS) / 3
              const deskripsi = siswaNilai?.deskripsi || ''

              const siswaDenganTotal = metaDataNilai.data.map((siswa) => {
                const formatif = editedNilai[siswa.nisn]?.formatif || siswa.structure.formatif
                const sumatif = editedNilai[siswa.nisn]?.sumatif || siswa.structure.sumatif
                const sumFormatif = formatif.reduce((a, b) => a + b, 0)
                const sumSumatif = sumatif.reduce((a, b) => a + b, 0)
                const totalNilai = (sumFormatif + sumSumatif) / siswa.nilai
                return { ...siswa, totalNilai }
              })
              const siswaTerurut = [...siswaDenganTotal].sort((a, b) => b.totalNilai - a.totalNilai)

              const rankingMap = {} as any
              siswaTerurut.forEach((s, i) => {
                rankingMap[s.nisn] = i + 1
              })

              return (
                <tr key={item.nisn} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                    {index + 1}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                    {item.nisn}
                  </td>
                  <td className="px-4 py-4 text-gray-500 dark:text-gray-400">{item.nama}</td>

                  {/* Formatif Cells */}
                  {Array.from({ length: maxFormatifColumns }).map((_, colIndex) => (
                    <td key={`formatif-${item.nisn}-${colIndex}`} className="px-1 py-2 text-center">
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min={1}
                        max={100}
                        maxLength={3}
                        className="w-full rounded-md px-3 py-2 bg-transparent dark:border-gray-600 text-gray-900 border focus:outline-none text-center dark:text-white"
                        type="text"
                        value={formatifNilai[colIndex] || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) > 100 ? 100 : e.target.value
                          handleNilaiChange(item.nisn, 'formatif', colIndex, String(value))
                        }}
                      />
                    </td>
                  ))}
                  {/* Empty cell for plus button */}
                  <td className="clmadd px-2 py-2 text-center"></td>
                  <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">
                    {naFormatif.toFixed(0)}
                  </td>

                  {/* Sumatif Cells */}
                  {Array.from({ length: maxSumatifColumns }).map((_, colIndex) => (
                    <td key={`sumatif-${item.nisn}-${colIndex}`} className="px-2 py-2 text-center">
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        min={1}
                        max={100}
                        maxLength={3}
                        className="w-full rounded-md px-3 py-2 bg-transparent dark:border-gray-600 text-gray-900 border focus:outline-none text-center dark:text-white"
                        type="text"
                        value={sumatifNilai[colIndex] || ''}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) > 100 ? 100 : e.target.value
                          handleNilaiChange(item.nisn, 'sumatif', colIndex, String(value))
                        }}
                      />
                    </td>
                  ))}
                  {/* Empty cell for plus button */}
                  <td className="clmadd px-2 py-2 text-center"></td>
                  <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">
                    {naSumatif.toFixed(0)}
                  </td>

                  {/* Nilai STS */}
                  <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">
                    {nilaiSTS}
                  </td>

                  {/* Sumatif Akhir Semester */}
                  <td className="px-2 py-2 text-center">
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={100}
                      maxLength={3}
                      className="w-full rounded-md px-3 py-2 bg-transparent dark:border-gray-600 text-gray-900 border focus:outline-none text-center dark:text-white"
                      type="text"
                      value={siswaNilai?.nonTES || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) > 100 ? 100 : e.target.value
                        handleNilaiChange(item.nisn, 'nonTES', null, String(value))
                      }}
                    />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <input
                      inputMode="numeric"
                      pattern="[0-9]*"
                      min={1}
                      max={100}
                      maxLength={3}
                      className="w-full rounded-md px-3 py-2 bg-transparent dark:border-gray-600 text-gray-900 border focus:outline-none text-center dark:text-white"
                      type="text"
                      value={siswaNilai?.tes || ''}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) > 100 ? 100 : e.target.value
                        handleNilaiChange(item.nisn, 'tes', null, String(value))
                      }}
                    />
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">
                    {item.calculated.naSumatifFinal.toFixed(0)}
                  </td>

                  {/* Nilai Rapot & Ranking */}
                  <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">
                    {NilaiRaport.toFixed(0)}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400 font-medium">
                    {rankingMap[item.nisn]}
                  </td>
                  <td className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                    <select
                      value={deskripsi}
                      onChange={(e) =>
                        handleNilaiChange(item.nisn, 'deskripsi', null, e.target.value)
                      }
                      className="w-full rounded-md px-3 py-2 bg-transparent dark:border-gray-600 text-gray-900 border focus:outline-none dark:text-white"
                    >
                      <option value="" className="hidden">
                        Capaian Kompetensi...
                      </option>
                      {competenceList.map((competence, idx) => (
                        <option key={idx} value={competence}>
                          {competence}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

PengelolaanNilai.layout = (page: any) => {
  return <GuruLayout>{page}</GuruLayout>
}
