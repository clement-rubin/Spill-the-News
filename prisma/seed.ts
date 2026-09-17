import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('changeme123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'spillthenews7@gmail.com' },
    update: {},
    create: {
      email: 'spillthenews7@gmail.com',
      passwordHash,
      name: 'Équipe Spill the News',
    },
  })

  await prisma.article.upsert({
    where: { slug: 'bienvenue-sur-spill-the-news' },
    update: {},
    create: {
      title: 'Bienvenue sur Spill the News',
      slug: 'bienvenue-sur-spill-the-news',
      body: 'Premier article de démonstration. Remplace-moi par du vrai contenu depuis /admin.',
      category: 'Édito',
      authorId: user.id,
    },
  })

  await prisma.episode.upsert({
    where: { id: 'seed-episode-1' },
    update: {},
    create: {
      id: 'seed-episode-1',
      title: 'Épisode 1 — Le lancement',
      description: 'Épisode de démonstration. Remplace-moi par un vrai épisode depuis /admin.',
      externalLink: 'https://open.spotify.com',
      authorId: user.id,
    },
  })

  console.log('Seed complete. Login: spillthenews7@gmail.com / changeme123')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
