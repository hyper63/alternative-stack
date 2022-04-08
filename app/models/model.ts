import z from 'zod'

// eslint-disable-next-line no-useless-escape
export const IdSchema = (prefix: string) => z.string().regex(new RegExp(`${prefix}-([\w-]+)$`))
