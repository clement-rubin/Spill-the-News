import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Motion from '@/components/Motion'
import LogoField from '@/components/LogoField'
import Newsletter from '@/components/Newsletter'

export const metadata = {
  title: 'Spill the News — média étudiant',
  description:
    "L'actu autour d'une tasse de thé : société, politique, culture, environnement, économie, en articles, vidéos et podcasts.",
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
        <Newsletter />
      </body>
    </html>
  )
}
