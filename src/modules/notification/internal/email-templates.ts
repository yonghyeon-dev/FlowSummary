const HEADER = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #f9fafb;">
  <div style="background: #000; padding: 16px 24px;">
    <span style="color: #fff; font-size: 16px; font-weight: bold;">FlowSummary</span>
  </div>
  <div style="padding: 24px; background: #fff;">`;

const FOOTER = `  </div>
  <div style="padding: 16px 24px; text-align: center;">
    <p style="color: #9ca3af; font-size: 11px; margin: 0;">이 이메일은 FlowSummary에서 자동 발송되었습니다.</p>
    <p style="color: #9ca3af; font-size: 11px; margin: 4px 0 0;">알림 설정은 워크스페이스 설정에서 변경할 수 있습니다.</p>
  </div>
</body>
</html>`;

function wrapEmail(content: string): string {
  return `${HEADER}${content}${FOOTER}`;
}

export function assignmentEmailHtml(data: {
  userName: string;
  meetingTitle: string;
  actionItemTitle: string;
  dueDate: string | null;
  meetingUrl: string;
}): string {
  return wrapEmail(`
    <h2 style="color: #1a1a1a; margin: 0 0 16px;">새로운 할 일이 배정되었습니다</h2>
    <p style="color: #374151;">안녕하세요 ${data.userName}님,</p>
    <p style="color: #374151;"><strong>${data.meetingTitle}</strong> 회의에서 다음 할 일이 배정되었습니다:</p>
    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #000;">
      <p style="font-weight: bold; margin: 0 0 8px; color: #111827;">${data.actionItemTitle}</p>
      ${data.dueDate ? `<p style="color: #6b7280; margin: 0; font-size: 14px;">마감일: ${data.dueDate}</p>` : ""}
    </div>
    <a href="${data.meetingUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;">회의 상세 보기</a>`);
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
  const borderColor = data.isOverdue ? "#dc2626" : "#f59e0b";

  return wrapEmail(`
    <h2 style="color: #1a1a1a; margin: 0 0 16px;">${title}</h2>
    <p style="color: #374151;">안녕하세요 ${data.userName}님,</p>
    <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid ${borderColor};">
      <span style="background: ${badgeColor}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">${badgeText}</span>
      <p style="font-weight: bold; margin: 8px 0 4px; color: #111827;">${data.actionItemTitle}</p>
      <p style="color: #6b7280; margin: 0; font-size: 14px;">마감일: ${data.dueDate}</p>
      <p style="color: #9ca3af; margin: 4px 0 0; font-size: 13px;">회의: ${data.meetingTitle}</p>
    </div>
    <a href="${data.meetingUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;">할 일 확인하기</a>`);
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
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${item.title}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${item.assignee}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; color: #374151; font-size: 14px;">${item.dueDate ?? "-"}</td>
    </tr>`
    )
    .join("");

  return wrapEmail(`
    <h2 style="color: #1a1a1a; margin: 0 0 16px;">주간 미완료 작업 요약</h2>
    <p style="color: #374151;">안녕하세요 ${data.userName}님,</p>
    <p style="color: #374151;"><strong>${data.workspaceName}</strong> 워크스페이스의 주간 요약입니다:</p>
    <div style="display: flex; gap: 16px; margin: 16px 0;">
      <div style="background: #fef2f2; padding: 16px; border-radius: 8px; flex: 1; text-align: center;">
        <p style="font-size: 28px; font-weight: bold; margin: 0; color: #dc2626;">${data.overdueCount}</p>
        <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">지연</p>
      </div>
      <div style="background: #fffbeb; padding: 16px; border-radius: 8px; flex: 1; text-align: center;">
        <p style="font-size: 28px; font-weight: bold; margin: 0; color: #f59e0b;">${data.inProgressCount}</p>
        <p style="font-size: 12px; color: #6b7280; margin: 4px 0 0;">진행 중</p>
      </div>
    </div>
    ${
      data.items.length > 0
        ? `<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280;">할 일</th>
          <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280;">담당자</th>
          <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #6b7280;">마감일</th>
        </tr>
      </thead>
      <tbody>${itemsHtml}</tbody>
    </table>`
        : `<p style="color: #6b7280;">미완료 작업이 없습니다.</p>`
    }
    <a href="${data.dashboardUrl}" style="display: inline-block; background: #000; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-size: 14px;">대시보드 보기</a>`);
}
