import Link from "next/link";
import { signup } from "@/modules/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">회원가입</CardTitle>
        <CardDescription>FlowSummary 계정을 만드세요</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <p className="text-sm text-destructive text-center mb-4">{error}</p>
        )}

        <form action={signup} className="flex flex-col gap-3">
          <div className="space-y-1">
            <Label htmlFor="name">이름</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="홍길동"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="6자 이상"
              required
              minLength={6}
            />
          </div>
          <Button type="submit" className="w-full">
            회원가입
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          이미 계정이 있으신가요?{" "}
          <Link href="/login" className="font-medium underline">
            로그인
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
