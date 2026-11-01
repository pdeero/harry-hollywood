import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const videos = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/videos' }),
  schema: z.object({
    title: z.string(),
    longTitle: z.string().optional(),
    note: z.string().optional(),
    kind: z.enum(['Commercial', 'Musikvideo']),
    youtube: z.string(),
    date: z.coerce.date(),
    poster: z.string().optional(),
  }),
});

export const collections = { videos };
