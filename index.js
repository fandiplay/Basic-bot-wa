const { default: makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");
const { tiktokPlugin } = require("./src/plugins/tiktok");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_session');
    const sock = makeWASocket({ logger: pino({ level: 'silent' }), auth: state, printQRInTerminal: false });

    if (!sock.authState.creds.registered) {
        const phoneNumber = await question('Masukkan nomor WhatsApp (Format: 628xxx): ');
        setTimeout(async () => {
            let code = await sock.requestPairingCode(phoneNumber.trim());
            console.log(`\n🚀 KODE PAIRING LU: ${code}\n`);
        }, 3000);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection } = update;
        if (connection === 'close') { const shouldReconnect = (update.lastDisconnect?.error?.output?.statusCode !== 401); if (shouldReconnect) startBot(); }
        else if (connection === 'open') console.log('✅ Bot WhatsApp Modular Aktif!');
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        
        // JANGAN gunakan toLowerCase() di sini agar URL tidak rusak
        const rawMessage = (msg.message.conversation || msg.message.extendedTextMessage?.text || '').trim();

        // Gunakan toLowerCase() HANYA untuk deteksi perintah teks biasa seperti ping
        if (rawMessage.toLowerCase() === 'ping') {
            return await sock.sendMessage(remoteJid, { text: 'pong 🏓' });
        }

        // Oper link asli (tanpa diubah huruf kecil) ke plugin TikTok
        await tiktokPlugin(sock, msg, remoteJid, rawMessage);
    });

    sock.ev.on('creds.update', saveCreds);
}

startBot();
