export function assignmentEmailHtml(data: {
  userName: string;
  meetingTitle: string;
  actionItemTitle: string;
  dueDate: string | null;
  meetingUrl: string;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">새로운 할 일이 배정되었습니다</h2>
  <p>안녕하세요 ${data.userName}님,</p>
  <p><strong>${data.meetingTitle}</strong> 회의에서 다음 할 일이 배정되었습니다:</p>
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <p style="font-weight: bold; margin: 0 0 8px;">${data.actionItemTitle}</p>
    ${data.dueDate ? `<p style="color: #666; margin: 0;">마감일: ${data.dueDate}</p>` : ""}
  </div>
  <a href="${data.meetingUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">회의 상세 보기</a>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">FlowSummary에서 발송된 이메일입니다.</p>
</body>
</html>`;
}

export function reminderEmailHtml(data: {
  userName: string;
  actionItemTitle: string;
  dueDate: string;
  meetingTitle: string;
  meetingUrl: string;
  isOverdue: boolean;
}): string {
  const title = data.isOverdue
    ? "마감일이 지난 할 일이 있습니다"
    : "할 일 마감일이 다가오고 있습니다";

  const badgeColor = data.isOverdue ? "#dc2626" : "#f59e0b";
  const badgeText = data.isOverdue ? "지연" : "리마인드";

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">${title}</h2>
  <p>안녕하세요 ${data.userName}님,</p>
  <div style="background: #f5f5f5; padding: 16px; border-radius: 8px; margin: 16px 0;">
    <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${badgeText}</span>
    <p style="font-weight: bold; margin: 8px 0 4px;">${data.actionItemTitle}</p>
    <p style="color: #666; margin: 0;">마감일: ${data.dueDate}</p>
    <p style="color: #999; margin: 4px 0 0; font-size: 13px;">회의: ${data.meetingTitle}</p>
  </div>
  <a href="${data.meetingUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">할 일 확인하기</a>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">FlowSummary에서 발송된 이메일입니다.</p>
</body>
</html>`;
}

export function weeklySummaryEmailHtml(data: {
  userName: string;
  workspaceName: string;
  overdueCount: number;
  inProgressCount: number;
  items: { title: string; assignee: string; dueDate: string | null }[];
  dashboardUrl: string;
}): string {
  const itemsHtml = data.items
    .map(
      (item) =>
        `<tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.assignee}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.dueDate ?? "-"}</td>
    </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">주간 미완료 작업 요약</h2>
  <p>안녕하세요 ${data.userName}님,</p>
  <p><strong>${data.workspaceName}</strong> 워크스페이스의 주간 요약입니다:</p>
  <div style="display: flex; gap: 16px; margin: 16px 0;">
    <div style="background: #fef2f2; padding: 12px; border-radius: 8px; flex: 1; text-align: center;">
      <p style="font-size: 24px; font-weight: bold; margin: 0; color: #dc2626;">${data.overdueCount}</p>
      <p style="font-size: 12px; color: #666; margin: 4px 0 0;">지연</p>
    </div>
    <div style="background: #fffbeb; padding: 12px; border-radius: 8px; flex: 1; text-align: center;">
      <p style="font-size: 24px; font-weight: bold; margin: 0; color: #f59e0b;">${data.inProgressCount}</p>
      <p style="font-size: 12px; color: #666; margin: 4px 0 0;">진행 중</p>
    </div>
  </div>
  ${
    data.items.length > 0
      ? `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <thead>
      <tr style="background: #f5f5f5;">
        <th style="padding: 8px; text-align: left;">할 일</th>
        <th style="padding: 8px; text-align: left;">담당자</th>
        <th style="padding: 8px; text-align: left;">마감일</th>
      </tr>
    </thead>
    <tbody>${itemsHtml}</tbody>
  </table>`
      : "<p>미완료 작업이 없습니다.</p>"
  }
  <a href="${data.dashboardUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none;">대시보드 보기</a>
  <p style="color: #999; font-size: 12px; margin-top: 32px;">FlowSummary에서 발송된 이메일입니다.</p>
</body>
</html>`;
}
