import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertTrainer(supabase: any, userId: string) {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: "trainer" });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden: solo administradores");
}

function generateTempPassword() {
  return Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 8).toUpperCase();
}

export const adminCreateClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { email: string; fullName: string; phone?: string; password?: string }) =>
    z.object({
      email: z.string().email().max(255),
      fullName: z.string().trim().min(2).max(120),
      phone: z.string().trim().max(30).optional(),
      password: z.string().min(8).max(72).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertTrainer(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = data.password?.trim() || generateTempPassword();
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName, phone: data.phone },
    });
    if (error) throw new Error(error.message);
    const uid = created.user!.id;
    // Ensure profile fields (trigger creates row; we upsert to be safe)
    await supabaseAdmin.from("profiles").upsert({
      id: uid,
      full_name: data.fullName,
      email: data.email,
      phone: data.phone ?? null,
    }, { onConflict: "id" });
    await supabaseAdmin.from("user_roles").upsert({ user_id: uid, role: "client" }, { onConflict: "user_id,role" });
    return { id: uid, tempPassword: password };
  });

export const adminUpdateClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { clientId: string; fullName?: string; email?: string; phone?: string | null }) =>
    z.object({
      clientId: z.string().uuid(),
      fullName: z.string().trim().min(2).max(120).optional(),
      email: z.string().email().max(255).optional(),
      phone: z.string().trim().max(30).nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertTrainer(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: any = {};
    if (data.fullName !== undefined) patch.full_name = data.fullName;
    if (data.email !== undefined) patch.email = data.email;
    if (data.phone !== undefined) patch.phone = data.phone;
    if (Object.keys(patch).length > 0) {
      const { error } = await supabaseAdmin.from("profiles").update(patch).eq("id", data.clientId);
      if (error) throw new Error(error.message);
    }
    if (data.email) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(data.clientId, { email: data.email });
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminResetClientPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { clientId: string; password?: string }) =>
    z.object({ clientId: z.string().uuid(), password: z.string().min(8).max(72).optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertTrainer(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const password = data.password?.trim() || generateTempPassword();
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.clientId, { password });
    if (error) throw new Error(error.message);
    return { tempPassword: password };
  });

export const adminSetClientStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { clientId: string; status: "active" | "disabled" }) =>
    z.object({ clientId: z.string().uuid(), status: z.enum(["active", "disabled"]) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertTrainer(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const disabled = data.status === "disabled";
    const { error: e1 } = await supabaseAdmin.from("profiles").update({
      status: data.status,
      disabled_at: disabled ? new Date().toISOString() : null,
    }).eq("id", data.clientId);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await supabaseAdmin.auth.admin.updateUserById(data.clientId, {
      ban_duration: disabled ? "876000h" : "none",
    } as any);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

export const adminGetClientAuthInfo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { clientId: string }) => z.object({ clientId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertTrainer(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u, error } = await supabaseAdmin.auth.admin.getUserById(data.clientId);
    if (error) throw new Error(error.message);
    return {
      last_sign_in_at: u.user?.last_sign_in_at ?? null,
      created_at: u.user?.created_at ?? null,
      email: u.user?.email ?? null,
    };
  });
