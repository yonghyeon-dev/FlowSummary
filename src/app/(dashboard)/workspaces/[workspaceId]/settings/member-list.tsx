"use client";

import { useState } from "react";
import {
  updateMemberRole,
  removeMember,
  updateMemberAliases,
} from "@/modules/workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MembershipRole } from "@prisma/client";

interface MemberInfo {
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: MembershipRole;
  aliases: string[];
  isActive: boolean;
}

interface MemberListProps {
  workspaceId: string;
  members: MemberInfo[];
  currentUserId: string;
  currentUserRole: MembershipRole;
}

const ROLE_LABELS: Record<MembershipRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export function MemberList({
  workspaceId,
  members,
  currentUserId,
  currentUserRole,
}: MemberListProps) {
  const canManage =
    currentUserRole === MembershipRole.OWNER ||
    currentUserRole === MembershipRole.ADMIN;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>이름</TableHead>
          <TableHead>이메일</TableHead>
          <TableHead>역할</TableHead>
          <TableHead>별칭</TableHead>
          {canManage && <TableHead className="w-24">관리</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <MemberRow
            key={member.userId}
            workspaceId={workspaceId}
            member={member}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            canManage={canManage}
          />
        ))}
      </TableBody>
    </Table>
  );
}

function MemberRow({
  workspaceId,
  member,
  currentUserId,
  currentUserRole,
  canManage,
}: {
  workspaceId: string;
  member: MemberInfo;
  currentUserId: string;
  currentUserRole: MembershipRole;
  canManage: boolean;
}) {
  const [aliasInput, setAliasInput] = useState("");
  const [aliases, setAliases] = useState(member.aliases);
  const isMe = member.userId === currentUserId;

  async function handleRoleChange(newRole: string) {
    await updateMemberRole(
      workspaceId,
      member.userId,
      newRole as MembershipRole
    );
  }

  async function handleRemove() {
    if (confirm(`${member.name ?? member.email}님을 제거하시겠습니까?`)) {
      await removeMember(workspaceId, member.userId);
    }
  }

  async function handleAddAlias() {
    if (!aliasInput.trim()) return;
    const newAliases = [...aliases, aliasInput.trim()];
    setAliases(newAliases);
    setAliasInput("");
    await updateMemberAliases(workspaceId, member.userId, newAliases);
  }

  async function handleRemoveAlias(index: number) {
    const newAliases = aliases.filter((_, i) => i !== index);
    setAliases(newAliases);
    await updateMemberAliases(workspaceId, member.userId, newAliases);
  }

  return (
    <TableRow>
      <TableCell className="font-medium">
        <span className={!member.isActive ? "text-muted-foreground" : ""}>
          {member.name ?? "-"}
        </span>
        {isMe && (
          <Badge variant="outline" className="ml-2">
            나
          </Badge>
        )}
        {!member.isActive && (
          <Badge variant="secondary" className="ml-2 text-xs">
            비활성
          </Badge>
        )}
      </TableCell>
      <TableCell>{member.email}</TableCell>
      <TableCell>
        {canManage && !isMe && member.role !== MembershipRole.OWNER ? (
          <Select defaultValue={member.role} onValueChange={handleRoleChange}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currentUserRole === MembershipRole.OWNER && (
                <SelectItem value="ADMIN">Admin</SelectItem>
              )}
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="MEMBER">Member</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <Badge variant="secondary">{ROLE_LABELS[member.role]}</Badge>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap items-center gap-1">
          {aliases.map((alias, i) => (
            <Badge key={i} variant="outline" className="gap-1">
              {alias}
              {(canManage || isMe) && (
                <button
                  onClick={() => handleRemoveAlias(i)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  x
                </button>
              )}
            </Badge>
          ))}
          {(canManage || isMe) && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddAlias();
              }}
              className="inline-flex"
            >
              <Input
                value={aliasInput}
                onChange={(e) => setAliasInput(e.target.value)}
                placeholder="별칭 추가"
                className="h-7 w-24 text-xs"
              />
            </form>
          )}
        </div>
      </TableCell>
      {canManage && (
        <TableCell>
          {!isMe && member.isActive && member.role !== MembershipRole.OWNER && (
            <Button variant="ghost" size="sm" onClick={handleRemove}>
              제거
            </Button>
          )}
        </TableCell>
      )}
    </TableRow>
  );
}
