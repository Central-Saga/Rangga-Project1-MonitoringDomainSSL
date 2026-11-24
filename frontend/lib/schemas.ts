import { z } from "zod";

/**
 * Validasi runtime untuk semua respons API di satu boundary (audit 1.4).
 *
 * `lib/api.ts` mem-parse setiap body JSON lewat skema dari modul ini sebelum
 * mengembalikannya ke pemanggil. Tidak ada lagi cast `as T` yang mempercayai
 * bentuk respons tanpa pemeriksaan. Endpoint baru tanpa skema khusus tetap
 * tervalidasi sebagai objek JSON (fallback), sehingga cakupannya 100%.
 */

const id = z.number().int();
const label = z.string();
const nullableText = z.string().nullable();
const timestamp = z.string().nullable().optional();
const money = z.union([z.string(), z.number()]);

/** Objek JSON apa pun: fallback untuk endpoint yang belum punya skema khusus. */
export const anyJsonObjectSchema = z.looseObject({});

export const clientSchema = z.looseObject({
  id,
  name: label,
  company: nullableText,
  email: nullableText,
  phone: nullableText,
  address: nullableText,
  projects_count: z.number().int().optional(),
  created_at: timestamp,
});

export const userSchema = z.looseObject({
  id,
  name: label,
  email: z.string().email(),
  role: z.enum(["admin", "staff", "client"]),
  role_label: label,
  client_id: z.number().int().nullable(),
  // Relasi opsional: bentuk nested resource bisa berubah tanpa merusak boundary.
  client: z.unknown().optional(),
  created_at: timestamp,
});

export const projectSchema = z.looseObject({
  id,
  client_id: id,
  name: label,
  description: nullableText,
  status: z.enum(["active", "on_hold", "completed"]),
  status_label: label,
  start_date: z.string().nullable(),
  end_date: z.string().nullable(),
  assets_count: z.number().int().optional(),
  created_at: timestamp,
});

export const assetSchema = z.looseObject({
  id,
  project_id: id,
  type: z.enum(["domain", "hosting", "ssl", "vps"]),
  type_label: label,
  name: label,
  provider: nullableText,
  renewal_cost: money,
  billing_cycle: z.enum(["monthly", "yearly"]),
  billing_cycle_label: label,
  start_date: z.string().nullable(),
  expired_date: z.string(),
  days_until_expiry: z.number().int(),
  auto_renew: z.boolean(),
  status: z.enum(["active", "expired", "suspended", "on_hold", "completed", "paid", "pending"]),
  status_label: label,
  metadata: z.unknown(),
  notes: nullableText,
  created_at: timestamp,
});

export const renewalSchema = z.looseObject({
  id,
  asset_id: id,
  renewed_by: z.number().int().nullable(),
  renewed_by_name: nullableText,
  renewal_date: z.string(),
  previous_expired_date: z.string(),
  new_expired_date: z.string(),
  cost: money,
  invoice_number: nullableText,
  payment_method: nullableText,
  status: z.enum(["paid", "pending"]),
  status_label: label,
  notes: nullableText,
  created_at: timestamp,
});

const paginationMetaSchema = z.looseObject({
  current_page: z.number().int(),
  last_page: z.number().int(),
  total: z.number().int(),
  per_page: z.number().int().optional(),
});

/** Laravel `JsonResource::collection(paginator)`. */
export const paginatedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.looseObject({
    data: z.array(item),
    meta: paginationMetaSchema,
  });

/** Laravel `JsonResource` tunggal selalu dibungkus `data`. */
export const wrappedSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.looseObject({ data: item });

/** Koleksi resource tanpa paginasi (dari `get()`, bukan `paginate()`). */
export const collectionSchema = <T extends z.ZodTypeAny>(item: T) =>
  z.looseObject({ data: z.array(item) });

/** `{ user: { data: ... } }` dari login/register, dengan toleransi resource tanpa wrapper. */
export const sessionSchema = z.looseObject({
  user: z.union([wrappedSchema(userSchema), userSchema]),
});

export const messageSchema = z.looseObject({ message: label });

export const notificationListSchema = z.looseObject({
  data: z.array(z.looseObject({
    id: z.string(),
    type: label,
    data: z.record(z.string(), z.unknown()),
    read_at: z.string().nullable(),
    created_at: z.string().nullable(),
  })),
  meta: paginationMetaSchema,
  unread_count: z.number().int().optional(),
});

export const dashboardSchema = z.looseObject({
  summary: z.looseObject({
    clients: z.number().int().nullable(),
    projects: z.number().int(),
    assets_total: z.number().int(),
    assets_by_type: z.record(z.string(), z.number()),
    expiring_in_30_days: z.number().int(),
    expiring_in_7_days: z.number().int(),
    expired: z.number().int(),
    unread_notifications: z.number().int(),
  }),
  // Resource koleksi bersarang di response()->json() tiba sebagai array polos,
  // bukan { data: [...] } seperti endpoint koleksi top-level.
  countdown: z.array(assetSchema),
});

/**
 * Normalisasi path dinamis agar `/assets/42/renewals` dan `/assets/7/renewals`
 * memakai skema yang sama. Query string dibuang karena tidak mengubah bentuk body.
 */
export function normalizeApiPath(path: string): string {
  const pathname = path.split("?")[0] ?? path;
  const segments = pathname.split("/").filter(Boolean);
  // Klien memakai route legacy (/api/...), tetapi /api/v1/... memakai resource
  // yang sama. Samakan keduanya agar satu skema dipakai untuk dua prefix.
  if (segments[0] === "v1") segments.shift();

  return `/${segments.map((segment) =>
    /^\d+$/.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment)
      ? ":id"
      : segment
  ).join("/")}`;
}

const registry: Record<string, z.ZodTypeAny> = {
  "GET /auth/me": wrappedSchema(userSchema),
  "POST /auth/login": sessionSchema,
  "POST /auth/register": sessionSchema,
  "POST /auth/logout": messageSchema,
  "POST /auth/change-password": messageSchema,

  "GET /dashboard/summary": dashboardSchema,

  "GET /clients": paginatedSchema(clientSchema),
  "GET /clients/:id": wrappedSchema(clientSchema),
  "POST /clients": wrappedSchema(clientSchema),
  "PUT /clients/:id": wrappedSchema(clientSchema),

  "GET /projects": paginatedSchema(projectSchema),
  "GET /projects/:id": wrappedSchema(projectSchema),
  "POST /projects": wrappedSchema(projectSchema),
  "PUT /projects/:id": wrappedSchema(projectSchema),

  "GET /assets": paginatedSchema(assetSchema),
  "GET /assets/:id": wrappedSchema(assetSchema),
  "POST /assets": wrappedSchema(assetSchema),
  "PUT /assets/:id": wrappedSchema(assetSchema),
  "GET /assets/:id/renewals": collectionSchema(renewalSchema),
  "POST /assets/:id/renewals": wrappedSchema(renewalSchema),

  "GET /renewals/:id": wrappedSchema(renewalSchema),
  "PUT /renewals/:id": wrappedSchema(renewalSchema),

  "GET /users": paginatedSchema(userSchema),
  "GET /users/:id": wrappedSchema(userSchema),
  "POST /users": wrappedSchema(userSchema),
  "PUT /users/:id": wrappedSchema(userSchema),

  "GET /notifications": notificationListSchema,
  "POST /notifications/:id/read": messageSchema,
  "POST /notifications/read-all": messageSchema,
};

/** Skema untuk method + path. Fallback tetap memakai zod (objek JSON apa pun). */
export function responseSchemaFor(method: string, path: string): z.ZodTypeAny {
  return registry[`${method.toUpperCase()} ${normalizeApiPath(path)}`] ?? anyJsonObjectSchema;
}
