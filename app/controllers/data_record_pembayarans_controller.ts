import DataPembayaran from '#models/data_pembayaran'
import DataWebsite from '#models/data_website'
import RecordPembayaran from '#models/record_pembayaran'
import type { HttpContext } from '@adonisjs/core/http'
import logger from '@adonisjs/core/services/logger'
import db from '@adonisjs/lucid/services/db'

export default class DataRecordPembayaransController {
  public async index({ request, inertia, session }: HttpContext) {
    const page = request.input('page', 1)
    const search = request.input('search', '')

    // Query untuk mengambil data transaksi Midtrans
    const query = RecordPembayaran.query()
      .preload('user', (userQuery) => {
        userQuery.preload('dataSiswa').select(['id', 'fullName', 'email'])
      })
      .preload('pembayaran', (pembayaranQuery) => {
        pembayaranQuery.select(['id', 'jenisPembayaran'])
      })
      .orderBy('created_at', 'desc')

    // Logic Search berdasarkan kriteria: nama pembayar, id transaksi, atau nama siswa
    if (search) {
      query.where((subquery) => {
        // 1. Search berdasarkan ID Transaksi Midtrans
        subquery.where('id', 'LIKE', `%${search}%`)

        // 2. Search berdasarkan Nama Pembayar (User Full Name)
        subquery.orWhereHas('user', (user) => {
          user.where('fullName', 'LIKE', `%${search}%`)
        })

        // 3. Search berdasarkan NISN Siswa (Siswa Name)
        subquery.orWhereHas('user', (user) => {
          user.whereHas('dataSiswa', (siswa) => {
            siswa.where('nisn', 'LIKE', `%${search}%`)
          })
        })
      })
    }

    const transactions = await query.paginate(page, 15)

    const data = transactions.all().map((item) => {
      const user = item.user
      const siswa = user?.dataSiswa
      return {
        id: item.id, // Order ID Midtrans
        pembayaranId: item.pembayaranId,
        transactionStatus: item.transactionStatus,
        grossAmount: item.grossAmount,
        transactionTime: item.transactionTime,
        userName: user?.fullName || 'N/A',
        userEmail: user?.email || 'N/A',
        jenisPembayaran: item.pembayaran?.jenisPembayaran || 'N/A',
        nisn: siswa?.nisn || 'N/A',
        // Tambahkan data lain yang diperlukan
      }
    })

    return inertia.render('Pembayaran/Midtrans', {
      transactions: data,
      pagination: transactions.getMeta(),
      filter: { search },
      session: session.flashMessages.all(),
    })
  }

  // DI DALAM RecordPembayaranController.ts

  public async getMidtransStatusProxy({ response, session, params }: HttpContext) {
    const orderId = params.orderId // Ambil Order ID dari parameter rute
    if (!orderId) {
      session.flash({
        status: 'error',
        message: `ID is Required`,
      })
      return response.redirect().back()
    }

    try {
      const dataWebsite = (await DataWebsite.getAllSettings()) as any
      const serverKey = dataWebsite.midtrans_server_key
      const apiBaseUrl = dataWebsite.midtrans_isProduction
        ? 'https://api.midtrans.com/v2'
        : 'https://api.sandbox.midtrans.com/v2'

      // Lakukan fetch ke Midtrans API (AMAN, karena ini Server-to-Server)
      const midtransApiResponse = await fetch(`${apiBaseUrl}/${orderId}/status`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: 'Basic ' + Buffer.from(serverKey + ':').toString('base64'),
        },
      })

      const resultJson = await midtransApiResponse.json()

      // Kembalikan respons Midtrans (sukses atau error) ke frontend
      return response.status(midtransApiResponse.status).send(resultJson)
    } catch (error) {
      logger.error({ err: error, orderId }, 'Error proxying Midtrans Status API')
      session.flash({
        status: 'error',
        message: `Gagal Mengambil Data Midtrans`,
      })
      return response.redirect().back()
    }
  }

  public async handleNotification({ params, session, response }: HttpContext) {
    const trx = await db.transaction()
    const orderId = params.orderId

    const formatRupiah = (value: string | number) => {
      const stringValue = String(value)
      const number = stringValue.replace(/[^,\d]/g, '')
      const split = number.split(',')
      const remainder = split[0].length % 3
      let rupiah = split[0].substr(0, remainder)
      const thousand = split[0].substr(remainder).match(/\d{3}/gi)

      if (thousand) {
        const separator = remainder ? '.' : ''
        rupiah += separator + thousand.join('.')
      }

      rupiah = split[1] ? rupiah + ',' + split[1] : rupiah
      return 'Rp ' + rupiah
    }

    try {
      const dataWebsite = (await DataWebsite.getAllSettings()) as any
      const serverKey = dataWebsite.midtrans_server_key
      const apiBaseUrl = dataWebsite.midtrans_isProduction
        ? 'https://api.midtrans.com/v2'
        : 'https://api.sandbox.midtrans.com/v2'

      const midtransApiResponse = await fetch(`${apiBaseUrl}/${orderId}/status`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'content-type': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(serverKey + ':').toString('base64'),
        },
      })

      if (!midtransApiResponse.ok) {
        await trx.rollback()
        session.flash({
          status: 'error',
          message: `Midtrans API Error: ${midtransApiResponse.status}`,
        })
        return response.redirect().back()
      }

      // 2. BACA BODY RESPONS UNTUK MENDAPATKAN JSON
      const resultJson = await midtransApiResponse.json()

      await RecordPembayaran.updateOrCreate(
        {
          id: resultJson.order_id,
        },
        {
          id: resultJson.order_id,
          fraudStatus: resultJson.fraud_status,
          grossAmount: String(parseFloat(resultJson.gross_amount).toFixed(0)),
          pembayaranId: resultJson.custom_field2,
          transactionStatus: resultJson.transaction_status,
          transactionTime: resultJson.transaction_time,
          userId: resultJson.custom_field1,
          payment_method: resultJson.payment_type,
        },
        { client: trx }
      )

      if (
        resultJson.transaction_status == 'settlement' ||
        resultJson.transaction_status == 'capture'
      ) {
        const pembayaran = await DataPembayaran.findOrFail(resultJson.custom_field2)

        const nominalBaru = parseFloat(resultJson.gross_amount)
        if (isNaN(nominalBaru) || nominalBaru <= 0) {
          throw new Error('Nominal harus berupa angka yang valid dan lebih dari 0')
        }

        const currentBayar = pembayaran.getNominalBayarArray()

        const totalDibayar = currentBayar.reduce((total, item) => {
          return total + parseFloat(item.nominal || '0')
        }, 0)

        const nominalPenetapan = parseFloat(pembayaran.nominalPenetapan || '0')
        const sisaPembayaran = nominalPenetapan - totalDibayar

        if (nominalBaru > sisaPembayaran) {
          throw new Error(
            `Nominal pembayaran (${formatRupiah(String(nominalBaru))}) melebihi sisa pembayaran (${formatRupiah(String(sisaPembayaran))})`
          )
        }

        if (totalDibayar + nominalBaru > nominalPenetapan) {
          throw new Error(
            `Total pembayaran akan melebihi nominal penetapan. ` +
              `Sudah dibayar: ${formatRupiah(String(totalDibayar))}, ` +
              `Penetapan: ${formatRupiah(String(nominalPenetapan))}, ` +
              `Maksimal bisa bayar: ${formatRupiah(String(sisaPembayaran))}`
          )
        }

        currentBayar.push({
          nominal: resultJson.gross_amount,
          tanggal: resultJson.transaction_time,
          metode: resultJson.payment_type,
        })

        pembayaran.nominalBayar = JSON.stringify(currentBayar)
        await pembayaran.save()

        const totalSetelahBayar = totalDibayar + nominalBaru
        const sisaSetelahBayar = nominalPenetapan - totalSetelahBayar

        let message = `Pembayaran sebesar ${formatRupiah(String(nominalBaru))} berhasil ditambahkan.`

        if (sisaSetelahBayar <= 0) {
          message += ' STATUS: LUNAS!'
        } else {
          message += ` Sisa pembayaran: ${formatRupiah(String(sisaSetelahBayar))}`
        }

        session.flash({
          status: 'success',
          message: message,
        })
      }

      await trx.commit()

      return response.redirect().back()
    } catch (error) {
      await trx.rollback()
      session.flash({
        status: 'error',
        message: 'Internal Server Error',
      })
      console.log(error)

      return response.redirect().back()
    }
  }

  public async handleCancelOrder({ params, session, response }: HttpContext) {
    const orderId = params.orderId
    if (!orderId) {
      session.flash({ status: 'error', message: `ID is Required` })
      return response.redirect().back()
    }

    try {
      const dataWebsite = (await DataWebsite.getAllSettings()) as any
      const serverKey = dataWebsite.midtrans_server_key
      const apiBaseUrl = dataWebsite.midtrans_isProduction
        ? 'https://api.midtrans.com/v2'
        : 'https://api.sandbox.midtrans.com/v2'

      // Lakukan fetch ke Midtrans API (AMAN, karena ini Server-to-Server)
      const midtransApiResponse = await fetch(`${apiBaseUrl}/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Basic ' + Buffer.from(serverKey + ':').toString('base64'),
        },
        body: JSON.stringify({}),
      })

      const resultJson = await midtransApiResponse.json()

      if (resultJson.status_code == '200') {
        session.flash({
          status: 'success',
          message: `Berhasil Membatalkan Transaksi`,
        })

        const pembayaran = await RecordPembayaran.query().where('id', orderId).first()
        if (pembayaran) {
          pembayaran.merge({ transactionStatus: 'cancel' })
          await pembayaran.save()
        } else {
          logger.warn(`Record Pembayaran ID ${orderId} tidak ditemukan di DB lokal untuk diupdate.`)
        }
      } else {
        const statusInquiryResponse = await fetch(`${apiBaseUrl}/${orderId}/status`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            Authorization: 'Basic ' + Buffer.from(serverKey + ':').toString('base64'),
          },
        })
        const statusInquiryJson = await statusInquiryResponse.json()

        const pembayaran = await RecordPembayaran.query().where('id', orderId).first()
        if (statusInquiryJson.transaction_status === 'expire') {
          if (pembayaran) {
            pembayaran.merge({ transactionStatus: 'expire' })
            await pembayaran.save()
          }

          session.flash({
            status: 'warning',
            message: `Transaksi sudah kedaluwarsa (Expired). Status lokal diupdate.`,
          })
        } else if (statusInquiryJson.transaction_status == 'cancel') {
          pembayaran?.merge({ transactionStatus: 'cancel' })
          await pembayaran?.save()
        } else {
          session.flash({
            status: 'error',
            message: `Gagal: ${resultJson.status_message || 'Transaksi tidak dapat dibatalkan.'}`,
          })
        }
      }

      return response.redirect().back()
    } catch (error) {
      logger.error({ err: error, orderId }, 'Gagal memanggil Midtrans Cancel API')
      session.flash({ status: 'error', message: `Gagal membatalkan. Cek log server.` })
      return response.redirect().back()
    }
  }
}
