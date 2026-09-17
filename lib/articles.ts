import { prisma } from './db'
import { slugify } from './slugify'

export interface CreateArticleInput {
  title: string
  body: string
  category: string
  coverImage?: string
  authorId: string
}

export async function createArticle(input: CreateArticleInput) {
  const baseSlug = slugify(input.title)
  let slug = baseSlug
  let suffix = 1
  while (await prisma.article.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${++suffix}`
  }
  return prisma.article.create({
    data: { ...input, slug },
  })
}

export async function getArticles() {
  return prisma.article.findMany({
    orderBy: { publishedAt: 'desc' },
    include: { author: true },
  })
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findUnique({
    where: { slug },
    include: { author: true },
  })
}

export interface UpdateArticleInput {
  title?: string
  body?: string
  category?: string
  coverImage?: string
}

export async function updateArticle(id: string, input: UpdateArticleInput) {
  return prisma.article.update({ where: { id }, data: input })
}

export async function deleteArticle(id: string) {
  return prisma.article.delete({ where: { id } })
}
