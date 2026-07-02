const { ssstik } = require("./src/lib/ssstik");

async function test() {
    console.log("Mengetes link kiriman lu...");
    // Link yang mau lu tes dimasukkan ke sini
    const data = await ssstik("https://vt.tiktok.com/ZSQcbVSjU/");
    console.log("Hasil akhir objek:", data);
}
test();
