// Form.tsx - Versi yang lebih robust
import React, { useState, useEffect } from 'react'
import { useForm } from '@inertiajs/react'
import UniversalInput from '~/Components/UniversalInput'
import SuperAdminLayout from '~/Layouts/SuperAdminLayouts'

interface options {
  label: string
  value: string
}

interface FormData {
  jenjang: string
  namaKelas: string
  waliKelas: string
  siswa: string[]
  guruPengampu: string[]
  guruMapelMapping: { [key: string]: string[] }
}

interface Props {
  initialValues?: FormData
  onSubmit: (data: FormData) => void
  submitLabel: string
  dark?: boolean
  guruOption?: options[]
  siswaOption?: options[]
  mapelOptions?: options[]
  kelasSelected?: string
  setKelasSelected: any
}

export default function Form({
  initialValues,
  onSubmit,
  submitLabel,
  dark = false,
  guruOption,
  siswaOption,
  mapelOptions = [],
  kelasSelected,
  setKelasSelected,
}: Props) {
  // Default values yang clear
  const defaultValues: FormData = {
    jenjang: '',
    namaKelas: '',
    waliKelas: '',
    siswa: [],
    guruPengampu: [],
    guruMapelMapping: {},
  }

  // Initialize form data dengan initialValues atau default
  const { data, setData, processing, errors } = useForm<FormData>({
    ...defaultValues,
    ...initialValues,
  })

  useEffect(() => {
    setKelasSelected(data.jenjang)
  }, [data])

  // Local state untuk mapping - INITIALIZE DARI initialValues
  const [localMapping, setLocalMapping] = useState<{ [key: string]: string[] }>(
    initialValues?.guruMapelMapping || {}
  )

  // Effect untuk sync ketika initialValues berubah (saat edit)
  useEffect(() => {
    if (initialValues?.guruMapelMapping) {
      setLocalMapping(initialValues.guruMapelMapping)
      setData('guruMapelMapping', initialValues.guruMapelMapping)
    }
  }, [initialValues?.guruMapelMapping])

  // Effect untuk sync form data dengan local mapping
  useEffect(() => {
    setData('guruMapelMapping', localMapping)
  }, [localMapping])

  const handleGuruPengampuChange = (selectedGuru: string[]) => {
    const newMapping = { ...localMapping }

    Object.keys(newMapping).forEach((nip) => {
      if (!selectedGuru.includes(nip)) {
        delete newMapping[nip]
      }
    })

    selectedGuru.forEach((nip) => {
      if (!newMapping[nip]) {
        newMapping[nip] = []
      }
    })

    setLocalMapping(newMapping)
    setData('guruPengampu', selectedGuru)
  }

  const handleGuruMapelChange = (nip: string, selectedMapel: string[]) => {
    const newMapping = {
      ...localMapping,
      [nip]: selectedMapel,
    }
    setLocalMapping(newMapping)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Pastikan data terakhir disertakan
    const submitData = {
      ...data,
      guruMapelMapping: localMapping,
    }

    onSubmit(submitData)
  }

  const getGuruName = (nip: string) => {
    return guruOption?.find((g) => g.value === nip)?.label || nip
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UniversalInput
          type="number"
          name="jenjang"
          label="Jenjang"
          value={data.jenjang}
          onChange={(v: any) => setData('jenjang', v)}
          required
          dark={dark}
        />

        <UniversalInput
          type="text"
          name="namaKelas"
          uppercase
          noSpace
          label="Nama Kelas"
          value={data.namaKelas}
          onChange={(v: any) => setData('namaKelas', v)}
          required
          dark={dark}
        />

        <UniversalInput
          type="select"
          name="waliKelas"
          label="Wali Kelas"
          value={data.waliKelas}
          onChange={(v: any) => setData('waliKelas', v)}
          options={guruOption}
          required
          dark={dark}
        />

        <UniversalInput
          type="multiselect"
          name="guruPengampu"
          label="Guru Pengampu"
          value={data.guruPengampu}
          onChange={handleGuruPengampuChange}
          options={guruOption}
          required
          dark={dark}
        />

        <UniversalInput
          type="multiselect"
          name="siswa"
          label="Siswa"
          value={data.siswa}
          onChange={(v: any) => setData('siswa', v)}
          options={siswaOption}
          required
          dark={dark}
        />
      </div>

      {data.guruPengampu && data.guruPengampu.length > 0 && mapelOptions.length > 0 && (
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Mapping Guru - Mata Pelajaran (Opsional)
          </h3>

          {/* Debug info */}
          <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded mb-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {data.guruPengampu.length} guru dipilih, {Object.keys(localMapping).length} mapping
              tersimpan
            </p>
          </div>

          <div className="space-y-4">
            {data.guruPengampu.map((nip: string) => (
              <div key={nip} className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Mapel untuk: <span className="font-semibold">{getGuruName(nip)}</span>
                  </label>
                  <span className="text-xs bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                    {localMapping[nip]?.length || 0} mapel
                  </span>
                </div>
                <UniversalInput
                  type="multiselect"
                  name={`guruMapel-${nip}`}
                  value={localMapping[nip] || []}
                  onChange={(v: any) => handleGuruMapelChange(nip, v)}
                  options={mapelOptions}
                  dark={dark}
                  placeholder="Pilih mata pelajaran..."
                />
                {/* Tampilkan mapel yang dipilih */}
                {localMapping[nip] && localMapping[nip].length > 0 && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Dipilih:{' '}
                      {localMapping[nip]
                        .map((mapelId) => {
                          const mapel = mapelOptions.find((m) => m?.value === mapelId)
                          return mapel?.label
                        })
                        .join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={processing}
          className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {processing ? 'Menyimpan...' : submitLabel}
        </button>
      </div>
    </form>
  )
}

Form.layout = (page: any) => <SuperAdminLayout>{page}</SuperAdminLayout>
