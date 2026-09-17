import { prisma } from './db'

export interface CreateEpisodeInput {
  title: string
  description: string
  externalLink: string
  coverImage?: string
  authorId: string
}

export async function createEpisode(input: CreateEpisodeInput) {
  return prisma.episode.create({ data: input })
}

export async function getEpisodes() {
  return prisma.episode.findMany({
    orderBy: { publishedAt: 'desc' },
    include: { author: true },
  })
}

export async function getEpisodeById(id: string) {
  return prisma.episode.findUnique({
    where: { id },
    include: { author: true },
  })
}

export interface UpdateEpisodeInput {
  title?: string
  description?: string
  externalLink?: string
  coverImage?: string
}

export async function updateEpisode(id: string, input: UpdateEpisodeInput) {
  return prisma.episode.update({ where: { id }, data: input })
}

export async function deleteEpisode(id: string) {
  return prisma.episode.delete({ where: { id } })
}
