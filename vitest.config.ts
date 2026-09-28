import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // The app imports through "@/", so tests have to resolve it the same way or
  // any suite touching a server action or a component cannot even load.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  test: {
    environment: 'node',
  },
})
