import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // MapLibre (~1 Mo) est isolé dans le chunk différé de l'onglet Outdoor :
    // il n'est téléchargé qu'à l'ouverture de cet onglet (ou en arrière-plan).
    chunkSizeWarningLimit: 1200,
  },
})
