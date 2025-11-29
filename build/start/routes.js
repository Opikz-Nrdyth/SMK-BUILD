import AuthenticationController from '#controllers/authentication_controller';
import router from '@adonisjs/core/services/router';
import { middleware } from './kernel.js';
import DataSiswasController from '#controllers/data_siswas_controller';
import LandingPageController from '#controllers/data_website_controller';
import WhatsAppController from '#controllers/whats_apps_controller';
import ManifestController from '#controllers/manifest_controller';
import { AutomationPembayaranService } from '#services/pembayaran';
import DataRecordPembayaransController from '#controllers/data_record_pembayarans_controller';
import './sa-routes.ts';
import './admin-routes.ts';
import './guru-routes.js';
import './siswa-routes.js';
router
    .group(() => {
    router.get('/', [LandingPageController, 'Dashboard']);
    router.on('/textEditor').renderInertia('TextEditor');
    router.get('/profile', [LandingPageController, 'Profile']);
    router.get('/guru-staf', [LandingPageController, 'GuruStaf']);
    router.get('/blog', [LandingPageController, 'Blog']);
    router.get('/blog/:slug', [LandingPageController, 'showBlog']);
    router.get('/kegiatan', [LandingPageController, 'activity']);
    router.get('/kegiatan/:id', [LandingPageController, 'showActivity']);
    router.get('/login', [AuthenticationController, 'index']);
    router.get('/ppdb', [DataSiswasController, 'ppdbForm']);
})
    .middleware([middleware.webData()]);
router.get('/manifest.json', [ManifestController, 'show']);
router.post('/ppdb/register', [DataSiswasController, 'ppdbRegister']);
router.get('/ppdb/success', [DataSiswasController, 'ppdbSuccess']);
router.delete('/logout', [AuthenticationController, 'destroy']);
router.post('/login', [AuthenticationController, 'store']);
router.post('/register', [AuthenticationController, 'register']);
router.get('/penetapan', async () => {
    return await new AutomationPembayaranService().Penetapan();
});
router.post('/switch/:role', async ({ params, session, response }) => {
    const role = params.role;
    const allowedRoles = ['Guru', 'Staf'];
    if (!allowedRoles.includes(role)) {
        session.flash({
            status: 'error',
            message: `Role Tidak Valid`,
        });
        return response.redirect().back();
    }
    session.put('role', role);
    session.flash({
        status: 'success',
        message: `Berhasil beralih ke role ${role}`,
    });
    switch (role) {
        case 'Guru':
            return response.redirect('/guru');
        case 'Staf':
            return response.redirect('/staf');
        default:
            return response.redirect().back();
    }
});
router
    .group(() => {
    router.get('/pembayaran-spp', async () => {
        return await new AutomationPembayaranService().generateSpp();
    });
    router.get('/pembayaran-up', async () => {
        return await new AutomationPembayaranService().generateUP();
    });
    router.get('/pembayaran-du', async () => {
        return await new AutomationPembayaranService().generateDU();
    });
})
    .use(middleware.checkCron());
router
    .group(() => {
    router
        .group(() => {
        router.post('/initialize', [WhatsAppController, 'initialize']);
        router.get('/status', [WhatsAppController, 'getStatus']);
        router.get('/qr', [WhatsAppController, 'getQRCode']);
        router.post('/send-message', [WhatsAppController, 'sendMessage']);
        router.post('/bulk-send', [WhatsAppController, 'bulkSendMessage']);
        router.post('/bulk-check', [WhatsAppController, 'bulkCheckNumbers']);
        router.post('/destroy', [WhatsAppController, 'destroy']);
    })
        .prefix('/api/whatsapp');
    router
        .post('/midtrans/notification/:orderId', [
        DataRecordPembayaransController,
        'handleNotification',
    ])
        .as('midtrans.notification');
    router.get('/api/midtrans/status-proxy/:orderId', [
        DataRecordPembayaransController,
        'getMidtransStatusProxy',
    ]);
    router.get('/api/midtrans/:orderId/cancel', [
        DataRecordPembayaransController,
        'handleCancelOrder',
    ]);
})
    .use([middleware.auth()]);
//# sourceMappingURL=routes.js.map