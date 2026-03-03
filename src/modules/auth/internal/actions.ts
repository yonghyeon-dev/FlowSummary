"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function signup(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // User 레코드 생성
  if (data.user) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: {},
      create: {
        id: data.user.id,
        email,
        name,
      },
    });
  }

  revalidatePath("/", "layout");
  redirect("/login?message=이메일을 확인해주세요");
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  // User 레코드 upsert (소셜 로그인 등으로 먼저 생성되었을 수 있음)
  if (data.user) {
    await prisma.user.upsert({
      where: { id: data.user.id },
      update: {},
      create: {
        id: data.user.id,
        email: data.user.email!,
        name: data.user.user_metadata?.name ?? null,
      },
    });
  }

  revalidatePath("/", "layout");
  redirect("/workspaces");
}

export async function loginWithGoogle() {
  const supabase = await createClient();
  const headerList = await headers();
  const origin = headerList.get("origin") ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(data.url);
}

export async function updateUserSettings(
  userId: string,
  data: { timezone?: string; notificationEnabled?: boolean }
) {
  const updateData: Record<string, unknown> = {};
  if (data.timezone !== undefined) updateData.timezone = data.timezone;
  if (data.notificationEnabled !== undefined)
    updateData.notificationEnabled = data.notificationEnabled;

  return prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
}

export async function getUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      timezone: true,
      notificationEnabled: true,
    },
  });
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
