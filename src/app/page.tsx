import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">FlowSummary</CardTitle>
          <CardDescription>
            회의를 업로드하면 AI가 요약하고 액션 아이템을 추적합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <a href="/login">시작하기</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
