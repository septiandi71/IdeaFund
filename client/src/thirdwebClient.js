// src/thirdwebClient.js
import { createThirdwebClient } from "thirdweb";
import { createWallet } from "thirdweb/wallets";

const thirdwebClientId = import.meta.env.VITE_THIRDWEB_CLIENT_ID;

if (!thirdwebClientId || 
    thirdwebClientId === "YOUR_CLIENT_ID_PLACEHOLDER" || 
    thirdwebClientId === "YOUR_FALLBACK_CLIENT_ID"// Menangani variasi placeholder
   ) { // Pemeriksaan dasar format client ID
  const errorMessage = "KRITIS: VITE_THIRDWEB_CLIENT_ID tidak dikonfigurasi dengan benar di file .env atau merupakan placeholder.";
  console.error(errorMessage);
  // Anda bisa memilih untuk melempar error di sini untuk menghentikan aplikasi jika ID tidak valid
  // throw new Error(errorMessage);
}

export const client = createThirdwebClient({
  clientId: thirdwebClientId,
});

export const supportedWallets = [
  createWallet("io.metamask"),
  createWallet("com.coinbase.wallet"),
  createWallet("me.rainbow"), // Konsisten dengan LoginPage.jsx
];