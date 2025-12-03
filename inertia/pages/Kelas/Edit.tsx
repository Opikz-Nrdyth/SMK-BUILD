import { router, usePage } from '@inertiajs/react'
import React, { useMemo, useState } from 'react'
import { Notification } from '~/Components/Notification'
import Form from './Form'
import SuperAdminLayout from '~/Layouts/SuperAdminLayouts'
import { Kelas } from './types'
import StafLayout from '~/Layouts/StafLayouts'
import { useNotification } from '~/Components/NotificationAlert'

export default function Edit({ kelas, guruWithMapel, dataSiswa, semuaMapel }: any) {
  const initialValues: Kelas = {
    jenjang: kelas.jenjang,
    namaKelas: kelas.namaKelas,
    siswa: Array.isArray(kelas.siswa) ? kelas.siswa : [],
    waliKelas: kelas.waliKelas,
    guruPengampu: Array.isArray(kelas.guruPengampu) ? kelas.guruPengampu : [],
    guruMapelMapping:
      kelas.guruMapelMapping && typeof kelas.guruMapelMapping === 'object'
        ? kelas.guruMapelMapping
        : {},
  }

  const [kelasSelected, setKelasSelected] = useState('')

  const { props } = usePage()
  const pattern = (props?.pattern as string).split('/').filter((item: any) => item != '')

  let baseUrl = `/${pattern[0]}/${pattern[1]}`

  // Buat query object
  const params = new URLSearchParams()

  // Tambahkan query page jika ada
  if (props?.page) {
    params.set('page', props.page as string)
  }

  // Gabungkan final URL
  const url = params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl

  const guru = useMemo(() => {
    if (!guruWithMapel) return []

    return guruWithMapel.map((item: any) => ({
      label: item?.fullName,
      value: item.nip,
    }))
  }, [guruWithMapel])
  const siswa = useMemo(() => {
    return dataSiswa.map((item: any) => ({
      label: item.user.fullName,
      value: item.nisn,
    }))
  }, [dataSiswa])

  const mapelOptions = useMemo(() => {
    if (!semuaMapel) return []

    return semuaMapel
      .filter((mapel: any) => kelasSelected == mapel.jenjang)
      .map((mapel: any) => ({
        label: `${mapel.namaMataPelajaran} (${mapel.jenjang})`,
        value: mapel.id.toString(),
      }))
  }, [semuaMapel, kelasSelected])

  const { notify } = useNotification()

  const handleSubmit = (data: any) => {
    router.put(`${url}/${kelas.id}`, data, {
      onSuccess: ({ props }: any) => {
        if (props.session.status == 'success') {
          router.visit(url)
        } else {
          props.session.error.messages.map((m: any) => notify(m.message, 'error'))
        }
      },
    })
  }

  return (
    <div className="max-w-6xl mx-auto lg:p-6">
      <Notification />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Data Staf</h1>
      <Form
        initialValues={initialValues}
        guruOption={guru}
        siswaOption={siswa}
        onSubmit={handleSubmit}
        mapelOptions={mapelOptions}
        submitLabel="Update"
        kelasSelected={kelasSelected}
        setKelasSelected={setKelasSelected}
      />
    </div>
  )
}

Edit.layout = (page: any) => {
  const activeRole = page.props.activeRole ?? page.props.user.role
  if (activeRole == 'Staf') {
    return <StafLayout>{page}</StafLayout>
  }

  return <SuperAdminLayout>{page}</SuperAdminLayout>
}
