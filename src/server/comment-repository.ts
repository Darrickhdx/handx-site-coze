import {
  chmodSync,
  closeSync,
  constants,
  existsSync,
  fchmodSync,
  fstatSync,
  fsyncSync,
  lstatSync,
  openSync,
  readFileSync,
  statSync,
  writeSync,
} from 'fs';

export type CommentStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'spam'
  | 'withdrawn';
export type ModerationAction = Exclude<CommentStatus, 'pending'>;

export interface NovelCommentSubmission {
  type: 'novel_comment_submission';
  id: string;
  occurred_at: string;
  chapter_id: string;
  display_name: string;
  body: string;
  session_hash: string;
  fingerprint: string;
  status: 'pending';
  consent_version: 'novel-comments-local-1';
}

export interface NovelCommentEvent {
  type: 'novel_comment_event';
  id: string;
  comment_id: string;
  occurred_at: string;
  action: ModerationAction;
  moderator: 'local-admin';
}

export interface ProjectedNovelComment {
  id: string;
  occurred_at: string;
  chapter_id: string;
  display_name: string;
  body: string;
  status: CommentStatus;
  moderated_at?: string;
}

export interface CommentRepositoryHealth {
  healthy: boolean;
  fail_closed: boolean;
  invalid_submission_lines: number;
  invalid_event_lines: number;
  submission_bytes: number;
  event_bytes: number;
  notice: string;
}

export interface ApprovedCommentPage {
  comments: ProjectedNovelComment[];
  total: number;
  truncated: boolean;
}

export interface CommentInboxPage {
  comments: ProjectedNovelComment[];
  total: number;
  total_pending: number;
  next_cursor: string | null;
  truncated: boolean;
  health: CommentRepositoryHealth;
}

export interface CommentRepository {
  appendSubmission(submission: NovelCommentSubmission): boolean;
  appendModeration(event: NovelCommentEvent): boolean;
  hasDuplicate(chapterId: string, fingerprint: string): boolean;
  listApproved(chapterId: string, limit?: number): ApprovedCommentPage;
  listInboxPage(options: {
    status: 'pending' | 'all';
    cursor: number;
    limit: number;
  }): CommentInboxPage;
  hasComment(commentId: string): boolean;
  health(): CommentRepositoryHealth;
}

interface ParsedLines<T> {
  records: T[];
  invalidLines: number;
}

interface ProjectionState {
  comments: ProjectedNovelComment[];
  health: CommentRepositoryHealth;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isSubmission(value: unknown): value is NovelCommentSubmission {
  return (
    isRecord(value) &&
    value.type === 'novel_comment_submission' &&
    typeof value.id === 'string' &&
    typeof value.occurred_at === 'string' &&
    typeof value.chapter_id === 'string' &&
    typeof value.display_name === 'string' &&
    typeof value.body === 'string' &&
    typeof value.session_hash === 'string' &&
    typeof value.fingerprint === 'string' &&
    value.status === 'pending' &&
    value.consent_version === 'novel-comments-local-1'
  );
}

function isModerationAction(value: unknown): value is ModerationAction {
  return (
    value === 'approved' ||
    value === 'rejected' ||
    value === 'spam' ||
    value === 'withdrawn'
  );
}

function isEvent(value: unknown): value is NovelCommentEvent {
  return (
    isRecord(value) &&
    value.type === 'novel_comment_event' &&
    typeof value.id === 'string' &&
    typeof value.comment_id === 'string' &&
    typeof value.occurred_at === 'string' &&
    isModerationAction(value.action) &&
    value.moderator === 'local-admin'
  );
}

function readLines<T>(
  path: string,
  validate: (value: unknown) => value is T,
): ParsedLines<T> {
  if (!existsSync(path)) return { records: [], invalidLines: 0 };
  const text = readFileSync(path, 'utf8').trim();
  if (!text) return { records: [], invalidLines: 0 };

  let invalidLines = 0;
  const records = text.split('\n').flatMap((line) => {
    try {
      const parsed = JSON.parse(line) as unknown;
      if (!validate(parsed)) {
        invalidLines += 1;
        return [];
      }
      return [parsed];
    } catch {
      invalidLines += 1;
      return [];
    }
  });
  return { records, invalidLines };
}

function assertSafeExistingFile(path: string): void {
  if (!existsSync(path)) return;
  const metadata = lstatSync(path);
  if (metadata.isSymbolicLink() || !metadata.isFile()) {
    throw new Error(`Unsafe private comment log: ${path}`);
  }
  chmodSync(path, 0o600);
}

function fileBytes(path: string): number {
  return existsSync(path) ? statSync(path).size : 0;
}

function fileSignature(path: string): string {
  if (!existsSync(path)) return 'missing';
  const metadata = statSync(path);
  return `${metadata.dev}:${metadata.ino}:${metadata.size}:${metadata.mtimeMs}`;
}

function appendLine(path: string, value: unknown, maximumBytes: number): boolean {
  const line = `${JSON.stringify(value)}\n`;
  const payload = Buffer.from(line, 'utf8');
  const descriptor = openSync(
    path,
    constants.O_APPEND |
      constants.O_CREAT |
      constants.O_WRONLY |
      (constants.O_NOFOLLOW ?? 0),
    0o600,
  );
  try {
    const metadata = fstatSync(descriptor);
    if (!metadata.isFile()) throw new Error(`Unsafe private comment log: ${path}`);
    if (metadata.size + payload.length > maximumBytes) return false;
    const written = writeSync(descriptor, payload);
    if (written !== payload.length) {
      throw new Error(`Incomplete private comment log write: ${path}`);
    }
    fsyncSync(descriptor);
    fchmodSync(descriptor, 0o600);
    return true;
  } finally {
    closeSync(descriptor);
  }
}

export class JsonLineCommentRepository implements CommentRepository {
  private cacheKey = '';
  private cachedState: ProjectionState | null = null;
  private failClosedAfterTerminalWriteFailure = false;

  constructor(
    private readonly submissionsPath: string,
    private readonly eventsPath: string,
    private readonly maximumBytes = 25 * 1024 * 1024,
  ) {
    assertSafeExistingFile(this.submissionsPath);
    assertSafeExistingFile(this.eventsPath);
  }

  private invalidate(): void {
    this.cacheKey = '';
    this.cachedState = null;
  }

  appendSubmission(submission: NovelCommentSubmission): boolean {
    let appended = false;
    try {
      appended = appendLine(
        this.submissionsPath,
        submission,
        this.maximumBytes,
      );
    } catch {
      this.invalidate();
      return false;
    }
    if (appended) this.invalidate();
    return appended;
  }

  appendModeration(event: NovelCommentEvent): boolean {
    const existing = this.projected().comments.find(
      (comment) => comment.id === event.comment_id,
    );
    if (existing?.status === event.action) return true;

    // Approval events may use only half of the event log. The remaining half is
    // reserved so every approved comment can still receive one terminal event.
    const ceiling =
      event.action === 'approved'
        ? Math.floor(this.maximumBytes / 2)
        : this.maximumBytes;
    let appended = false;
    try {
      appended = appendLine(this.eventsPath, event, ceiling);
    } catch {
      if (event.action !== 'approved') {
        this.failClosedAfterTerminalWriteFailure = true;
      }
      this.invalidate();
      return false;
    }
    if (appended) {
      this.invalidate();
    } else if (event.action !== 'approved') {
      // A failed withdrawal/rejection/spam write must never leave an older
      // approval visible. Public reads fail closed until the owner repairs the
      // local audit log.
      this.failClosedAfterTerminalWriteFailure = true;
      this.invalidate();
    }
    return appended;
  }

  private projected(): ProjectionState {
    const key = `${fileSignature(this.submissionsPath)}|${fileSignature(
      this.eventsPath,
    )}|${this.failClosedAfterTerminalWriteFailure}`;
    if (this.cachedState && this.cacheKey === key) return this.cachedState;

    const submissions = readLines(this.submissionsPath, isSubmission);
    const events = readLines(this.eventsPath, isEvent);
    const latestEvent = new Map<string, NovelCommentEvent>();
    for (const event of events.records) {
      latestEvent.set(event.comment_id, event);
    }
    const comments: ProjectedNovelComment[] = submissions.records.map((submission) => {
      const event = latestEvent.get(submission.id);
      return {
        id: submission.id,
        occurred_at: submission.occurred_at,
        chapter_id: submission.chapter_id,
        display_name: submission.display_name,
        body: submission.body,
        status: (event?.action ?? 'pending') as CommentStatus,
        ...(event ? { moderated_at: event.occurred_at } : {}),
      };
    });
    const failClosed =
      this.failClosedAfterTerminalWriteFailure ||
      submissions.invalidLines > 0 ||
      events.invalidLines > 0;
    const health: CommentRepositoryHealth = {
      healthy: !failClosed,
      fail_closed: failClosed,
      invalid_submission_lines: submissions.invalidLines,
      invalid_event_lines: events.invalidLines,
      submission_bytes: fileBytes(this.submissionsPath),
      event_bytes: fileBytes(this.eventsPath),
      notice: failClosed
        ? '评论日志存在损坏或终止事件未能写入；公开评论已安全隐藏，请在本机修复日志。'
        : '评论投稿与审核事件日志结构正常。',
    };
    const state: ProjectionState = { comments, health };
    this.cacheKey = key;
    this.cachedState = state;
    return state;
  }

  health(): CommentRepositoryHealth {
    return this.projected().health;
  }

  hasDuplicate(chapterId: string, fingerprint: string): boolean {
    const parsed = readLines(this.submissionsPath, isSubmission);
    return parsed.records.some(
      (submission) =>
        submission.chapter_id === chapterId &&
        submission.fingerprint === fingerprint,
    );
  }

  listApproved(chapterId: string, limit = 100): ApprovedCommentPage {
    const state = this.projected();
    if (!state.health.healthy) {
      return { comments: [], total: 0, truncated: false };
    }
    const approved = state.comments
      .filter(
        (comment) =>
          comment.chapter_id === chapterId && comment.status === 'approved',
      )
      .sort((left, right) => left.occurred_at.localeCompare(right.occurred_at));
    const safeLimit = Math.max(1, Math.min(100, limit));
    return {
      comments: approved.slice(-safeLimit),
      total: approved.length,
      truncated: approved.length > safeLimit,
    };
  }

  listInboxPage({
    status,
    cursor,
    limit,
  }: {
    status: 'pending' | 'all';
    cursor: number;
    limit: number;
  }): CommentInboxPage {
    const state = this.projected();
    const totalPending = state.comments.filter(
      (comment) => comment.status === 'pending',
    ).length;
    const filtered = state.comments
      .filter((comment) => status === 'all' || comment.status === 'pending')
      .sort((left, right) => {
        if (status === 'all' && left.status !== right.status) {
          if (left.status === 'pending') return -1;
          if (right.status === 'pending') return 1;
        }
        if (left.status === 'pending' && right.status === 'pending') {
          return left.occurred_at.localeCompare(right.occurred_at);
        }
        return right.occurred_at.localeCompare(left.occurred_at);
      });
    const safeCursor = Math.max(0, cursor);
    const safeLimit = Math.max(1, Math.min(100, limit));
    const comments = filtered.slice(safeCursor, safeCursor + safeLimit);
    const nextOffset = safeCursor + comments.length;
    return {
      comments,
      total: filtered.length,
      total_pending: totalPending,
      next_cursor: nextOffset < filtered.length ? String(nextOffset) : null,
      truncated: nextOffset < filtered.length,
      health: state.health,
    };
  }

  hasComment(commentId: string): boolean {
    return this.projected().comments.some(
      (submission) => submission.id === commentId,
    );
  }
}
