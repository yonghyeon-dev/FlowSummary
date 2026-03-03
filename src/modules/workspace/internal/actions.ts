"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/modules/auth";
import { MembershipRole } from "@prisma/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 50);
}

export async function createWorkspace(formData: FormData) {
  const user = await requireUser();
  const name = formData.get("name") as string;

  if (!name || name.trim().length === 0) {
    return redirect("/workspaces/new?error=이름을 입력해주세요");
  }

  const baseSlug = slugify(name) || `ws-${Date.now()}`;
  let slug = baseSlug;
  let counter = 0;

  // slug 중복 처리
  while (await prisma.workspace.findUnique({ where: { slug } })) {
    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  const workspace = await prisma.workspace.create({
    data: {
      name: name.trim(),
      slug,
      memberships: {
        create: {
          userId: user.id,
          role: MembershipRole.OWNER,
        },
      },
    },
  });

  revalidatePath("/workspaces");
  redirect(`/workspaces/${workspace.id}/dashboard`);
}

export async function updateMemberRole(
  workspaceId: string,
  targetUserId: string,
  newRole: MembershipRole
) {
  const user = await requireUser();

  // 권한 확인: Owner 또는 Admin만 가능
  const myMembership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: { userId: user.id, workspaceId },
    },
  });

  if (
    !myMembership ||
    !myMembership.isActive ||
    (myMembership.role !== MembershipRole.OWNER &&
      myMembership.role !== MembershipRole.ADMIN)
  ) {
    throw new Error("권한이 없습니다");
  }

  // OWNER 역할은 현재 Owner만 부여/변경 가능
  if (newRole === MembershipRole.OWNER) {
    if (myMembership.role !== MembershipRole.OWNER) {
      throw new Error("Owner만 Owner 역할을 부여할 수 있습니다");
    }
  }

  await prisma.membership.update({
    where: {
      userId_workspaceId: { userId: targetUserId, workspaceId },
    },
    data: { role: newRole },
  });

  revalidatePath(`/workspaces/${workspaceId}/settings`);
}

export async function removeMember(
  workspaceId: string,
  targetUserId: string
) {
  const user = await requireUser();

  const myMembership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: { userId: user.id, workspaceId },
    },
  });

  if (
    !myMembership ||
    !myMembership.isActive ||
    (myMembership.role !== MembershipRole.OWNER &&
      myMembership.role !== MembershipRole.ADMIN)
  ) {
    throw new Error("권한이 없습니다");
  }

  // Owner는 제거 불가
  const targetMembership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: { userId: targetUserId, workspaceId },
    },
  });

  if (targetMembership?.role === MembershipRole.OWNER) {
    throw new Error("Owner는 제거할 수 없습니다");
  }

  await prisma.membership.update({
    where: {
      userId_workspaceId: { userId: targetUserId, workspaceId },
    },
    data: { isActive: false },
  });

  revalidatePath(`/workspaces/${workspaceId}/settings`);
}

export async function updateMemberAliases(
  workspaceId: string,
  targetUserId: string,
  aliases: string[]
) {
  const user = await requireUser();

  // 본인이거나 Admin 이상
  if (user.id !== targetUserId) {
    const myMembership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId: user.id, workspaceId },
      },
    });

    if (
      !myMembership ||
      !myMembership.isActive ||
      (myMembership.role !== MembershipRole.OWNER &&
        myMembership.role !== MembershipRole.ADMIN)
    ) {
      throw new Error("권한이 없습니다");
    }
  }

  await prisma.membership.update({
    where: {
      userId_workspaceId: { userId: targetUserId, workspaceId },
    },
    data: { aliases },
  });

  revalidatePath(`/workspaces/${workspaceId}/settings`);
}
