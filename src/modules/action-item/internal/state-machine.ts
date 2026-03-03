import { ActionItemStatus } from "@prisma/client";

/**
 * ActionItem 상태 전이 규칙
 *
 * extracted → confirmed → in_progress → done
 *                                    ↘ overdue (시스템 자동, 마감일 초과)
 *          ↘ canceled (Admin 이상)
 */
export const VALID_ACTION_TRANSITIONS: Record<
  ActionItemStatus,
  ActionItemStatus[]
> = {
  [ActionItemStatus.EXTRACTED]: [
    ActionItemStatus.CONFIRMED,
    ActionItemStatus.CANCELED,
  ],
  [ActionItemStatus.CONFIRMED]: [
    ActionItemStatus.IN_PROGRESS,
    ActionItemStatus.CANCELED,
  ],
  [ActionItemStatus.IN_PROGRESS]: [
    ActionItemStatus.DONE,
    ActionItemStatus.OVERDUE,
    ActionItemStatus.CANCELED,
  ],
  [ActionItemStatus.DONE]: [],
  [ActionItemStatus.OVERDUE]: [
    ActionItemStatus.IN_PROGRESS,
    ActionItemStatus.DONE,
    ActionItemStatus.CANCELED,
  ],
  [ActionItemStatus.CANCELED]: [],
};

export function isValidActionTransition(
  from: ActionItemStatus,
  to: ActionItemStatus
): boolean {
  return VALID_ACTION_TRANSITIONS[from].includes(to);
}
