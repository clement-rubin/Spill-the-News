import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Motion from '@/components/Motion'
import LogoField from '@/components/LogoField'

export const metadata = {
  title: 'Spill the News — média étudiant',
  description:
    'Culture, arts et société, racontés par des étudiants. Articles et podcast.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <Motion />
        <LogoField />
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
