#!/usr/bin/env node
/**
 * Create (or verify) the Bitable table that stores reader comments.
 *
 * Run once, after creating a Feishu custom app with bitable:app permission and
 * a Base the app can reach:
 *
 *   FEISHU_APP_ID=cli_xxx \
 *   FEISHU_APP_SECRET=xxx \
 *   FEISHU_BITABLE_APP_TOKEN=bascnXXXX \
 *   node tools/setup-feishu-comments.mjs
 *
 * It prints the table id to put in FEISHU_BITABLE_TABLE_ID. Re-running is safe:
 * an existing table with the right name is reported rather than duplicated.
 */

const BASE = 'https://open.feishu.cn/open-apis';
const TABLE_NAME = '网站读者留言';

const appId = process.env.FEISHU_APP_ID;
const appSecret = process.env.FEISHU_APP_SECRET;
const appToken = process.env.FEISHU_BITABLE_APP_TOKEN;

if (!appId || !appSecret || !appToken) {
  console.error(
    '需要三个环境变量：FEISHU_APP_ID、FEISHU_APP_SECRET、FEISHU_BITABLE_APP_TOKEN',
  );
  process.exit(1);
}

async function call(path, init = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init.headers ?? {}),
    },
  });
  const data = await response.json();
  if (data.code !== 0) {
    throw new Error(`${path} -> code ${data.code}: ${data.msg}`);
  }
  return data.data ?? {};
}

const { tenant_access_token: token } = await call('/auth/v3/tenant_access_token/internal', {
  method: 'POST',
  body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
});
const auth = { Authorization: `Bearer ${token}` };

const existing = await call(`/bitable/v1/apps/${appToken}/tables?page_size=100`, {
  headers: auth,
});
const already = (existing.items ?? []).find((table) => table.name === TABLE_NAME);
if (already) {
  console.log(JSON.stringify({ status: 'exists', table_id: already.table_id }, null, 2));
  console.log(`\n把这个填进 FEISHU_BITABLE_TABLE_ID：${already.table_id}`);
  process.exit(0);
}

const created = await call(`/bitable/v1/apps/${appToken}/tables`, {
  method: 'POST',
  headers: auth,
  body: JSON.stringify({
    table: {
      name: TABLE_NAME,
      // 状态 is the moderation control: a row is invisible on the site until
      // this is changed to 已发布, and that change happens in the Bitable UI.
      fields: [
        { field_name: '内容', type: 1 },
        { field_name: '昵称', type: 1 },
        { field_name: '章节', type: 1 },
        { field_name: '章节标题', type: 1 },
        {
          field_name: '状态',
          type: 3,
          property: {
            options: [
              { name: '待审核', color: 0 },
              { name: '已发布', color: 1 },
              { name: '不发布', color: 2 },
            ],
          },
        },
        { field_name: '提交时间', type: 1 },
        { field_name: '会话哈希', type: 1 },
      ],
    },
  }),
});

console.log(JSON.stringify({ status: 'created', table_id: created.table_id }, null, 2));
console.log(`\n把这个填进 FEISHU_BITABLE_TABLE_ID：${created.table_id}`);
console.log(
  '\n审核方式：打开这张表，把「状态」从「待审核」改成「已发布」，网站一分钟内就会显示。',
);
