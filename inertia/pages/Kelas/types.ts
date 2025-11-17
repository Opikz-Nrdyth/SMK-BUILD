export interface Kelas {
  jenjang: string
  namaKelas: string
  waliKelas: string
  siswa: string[]
  guruPengampu: string[]
  guruMapelMapping?: Record<string, string[]>
}
