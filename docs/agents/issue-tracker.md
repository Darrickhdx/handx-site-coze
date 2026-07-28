# Issue tracker：本地 Markdown

本项目的规格和实施任务保存在 `.scratch/`，不自动创建或修改 GitHub Issues。

## 目录约定

- 每项改造使用一个独立目录：`.scratch/<feature-slug>/`
- 规格文件固定为：`.scratch/<feature-slug>/spec.md`
- 实施任务按依赖顺序分别保存为：
  `.scratch/<feature-slug>/issues/<NN>-<slug>.md`
- 每个任务文件只能描述一个可独立验证的纵向切片。
- `Blocked by` 记录真正阻塞该任务的前置任务。
- `Status` 记录任务当前状态。

## 发布规格或任务

当 skill 要求“发布到 issue tracker”时，只在对应的 `.scratch/<feature-slug>/`
目录中创建本地 Markdown 文件，不执行线上写入。

## 读取任务

实施前读取用户指定的规格或任务文件全文，并从所有阻塞任务均已完成的任务开始。
