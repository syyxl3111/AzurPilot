/**
 * 统计明细表（手机版）。
 *
 * 与 PC 的 `StatisticsTable` **同一套数据、同一套分页语义**：25 行一页、能搜索、
 * 能导出 CSV（复用 PC 的 `downloadCsv`），只是排版按窄屏来 —— 表格自己横向滚，
 * 而不是把列压到看不清。
 *
 * 为什么不在手机端直接挂 PC 的 `StatisticsTable`：它用 `useApp()` 取语言与文案，
 * 而评审入口（mobile-mockup.html）没有 AppProvider，一挂上去就抛错；它的表格标记
 * 也是为宽屏写的（sticky 表头 + 固定列宽）。所以保留 PC 的**算法与交互**，
 * 重画窄屏的皮。
 */
import { useState } from 'react'
import { Download } from 'lucide-react'
import type { Scalar } from '../../api/types'
import type { StatsTable as StatsTableData } from '../data'
import { downloadCsv } from '../../components/statisticsData'
import type { MobileTranslator } from '../i18n'

const PAGE_SIZE = 25

export function StatsTable({data, ui}: {data: StatsTableData; ui: MobileTranslator}) {
  const [page, setPage] = useState(0)
  const [search, setSearch] = useState('')
  const rows = data.rows.filter(row =>
    row.some(value => String(value ?? '').toLowerCase().includes(search.toLowerCase())))
  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const current = Math.min(page, pages - 1)
  return <section className="m-stat-table">
    <div className="m-stat-section-head">
      <span>{data.title}</span>
      <button type="button" className="text-button" disabled={!rows.length}
        onClick={() => downloadCsv(data.title, [data.columns, ...rows])}>
        <Download size={14} aria-hidden="true"/>{ui('stats.exportDetails')}
      </button>
    </div>
    {data.note ? <p className="m-stat-note">{data.note}</p> : null}
    <div className="m-table-toolbar">
      <input aria-label={ui('stats.searchTable', {title: data.title})} value={search}
        placeholder={ui('stats.searchPlaceholder')}
        onChange={event => { setSearch(event.target.value); setPage(0) }}/>
      <span>{ui('stats.records', {count: rows.length})}</span>
    </div>
    <div className="m-table-scroll">
      <table>
        <thead><tr>{data.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead>
        <tbody>
          {rows.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE).map((row, index) => (
            <tr key={index}>{row.map((value: Scalar, cell) => (
              <td key={cell}>{value == null ? '—' : typeof value === 'number'
                ? value.toLocaleString('zh-CN', {maximumFractionDigits: 4})
                : String(value)}</td>
            ))}</tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <p className="m-stat-note">{ui('stats.noRecords')}</p>}
    </div>
    <div className="m-table-toolbar m-table-pager">
      <button type="button" className="text-button" disabled={!current}
        onClick={() => setPage(current - 1)}>{ui('common.previous')}</button>
      <span>{current + 1} / {pages}</span>
      <button type="button" className="text-button" disabled={current + 1 === pages}
        onClick={() => setPage(current + 1)}>{ui('common.next')}</button>
    </div>
  </section>
}
