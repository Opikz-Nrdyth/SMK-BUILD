// resources/js/Pages/Nilai/NilaiRapor.tsx
import { router } from '@inertiajs/react'
import { useEffect, useState } from 'react'
import UniversalInput from '~/Components/UniversalInput'
import GuruLayout from '~/Layouts/GuruLayouts'

export default function NilaiRapor({ dataKelas }: any) {
  const [selectedKelas, setSelectedKelas] = useState('')
  const [selectedUjian, setSelectedUjian] = useState('')

  const optionKelas = dataKelas.map((item: any) => ({
    label: item.namaKelas,
    value: item.id,
  }))

  useEffect(() => {
    const getNilai = async () => {
      const response = await fetch(`/guru/rekap-nilai/${selectedKelas}/${selectedUjian}/nilai`)
      const data = await response.json()

      const responseKelas = await fetch(`/guru/rekap-nilai/${selectedKelas}/kelas`)
      const dataKelas = await responseKelas.json()
      console.log(data)
      console.log(dataKelas)
    }

    if (selectedKelas && selectedUjian) {
      getNilai()
    }
  }, [selectedKelas, selectedUjian])

  return (
    <div className="max-w-7xl mx-auto lg:p-6">
      <h1 className="text-2xl font-bold mb-6">Nilai Rapor</h1>

      {/* Filter */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <UniversalInput
          name="kelas"
          label="Pilih Kelas"
          type="select"
          value={selectedKelas}
          options={optionKelas}
          onChange={setSelectedKelas}
        />

        <UniversalInput
          name="ujian"
          label="Pilih Jenis Ujian"
          type="select"
          options={[
            {
              label: 'PAT',
              value: 'PAT',
            },
            {
              label: 'PAS',
              value: 'PAS',
            },
          ]}
          value={selectedUjian}
          onChange={setSelectedUjian}
        />
      </div>
    </div>
  )
}

NilaiRapor.layout = (page: any) => <GuruLayout>{page}</GuruLayout>
