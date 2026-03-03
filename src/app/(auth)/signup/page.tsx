import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function SignupPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">회원가입</CardTitle>
        <CardDescription>FlowSummary 계정을 만드세요</CardDescription>
      </CardHeader>
      <CardContent>
        {/* TODO: Phase 1에서 회원가입 폼 구현 */}
        <p className="text-center text-sm text-muted-foreground">
          회원가입 폼이 여기에 구현됩니다
        </p>
      </CardContent>
    </Card>
  );
}
