import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">로그인</CardTitle>
        <CardDescription>FlowSummary에 로그인하세요</CardDescription>
      </CardHeader>
      <CardContent>
        {/* TODO: Phase 1에서 로그인 폼 구현 */}
        <p className="text-center text-sm text-muted-foreground">
          로그인 폼이 여기에 구현됩니다
        </p>
      </CardContent>
    </Card>
  );
}
