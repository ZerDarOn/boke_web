import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { PaginationParams } from '../types';

export class GalleryService {
  static async findMany(params: {
    pagination: PaginationParams;
    albumId?: string;
  }) {
    const { pagination, albumId } = params;

    const where: Prisma.GalleryImageWhereInput = {
      ...(albumId && { albumId }),
    };

    const [images, total] = await Promise.all([
      prisma.galleryImage.findMany({
        where,
        skip: pagination.skip,
        take: pagination.limit,
        orderBy: { date: 'desc' },
        include: {
          album: true,
          _count: { select: { comments: true } },
        },
      }),
      prisma.galleryImage.count({ where }),
    ]);

    return { images, total };
  }

  static async findById(id: string) {
    return prisma.galleryImage.findUnique({
      where: { id },
      include: {
        album: true,
        comments: { orderBy: { date: 'desc' } },
      },
    });
  }

  static async create(data: Prisma.GalleryImageCreateInput) {
    return prisma.galleryImage.create({ data });
  }

  static async update(id: string, data: Prisma.GalleryImageUpdateInput) {
    return prisma.galleryImage.update({ where: { id }, data });
  }

  static async delete(id: string) {
    return prisma.galleryImage.delete({ where: { id } });
  }

  // Album methods
  static async findAlbums() {
    const albums = await prisma.album.findMany({
      orderBy: { lastUpdated: 'desc' },
      include: {
        _count: { select: { photos: true } },
      },
    });

    return albums.map(({ _count, ...album }) => ({
      ...album,
      photoCount: _count.photos,
    }));
  }

  static async findAlbumById(id: string) {
    const album = await prisma.album.findUnique({
      where: { id },
      include: {
        photos: { orderBy: { date: 'desc' } },
      },
    });

    return album ? { ...album, photoCount: album.photos.length } : null;
  }

  static async createAlbum(data: Prisma.AlbumCreateInput) {
    return prisma.album.create({ data });
  }

  static async updateAlbum(id: string, data: Prisma.AlbumUpdateInput) {
    return prisma.album.update({ where: { id }, data });
  }

  static async deleteAlbum(id: string) {
    return prisma.$transaction([
      prisma.galleryImage.updateMany({ where: { albumId: id }, data: { albumId: null } }),
      prisma.album.delete({ where: { id } }),
    ]);
  }

  static async addComment(photoId: string, data: { author: string; content: string }) {
    return prisma.photoComment.create({
      data: {
        ...data,
        photoId,
      },
    });
  }
}
